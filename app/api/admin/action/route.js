import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Scheme, Transaction, VirtualAccount, Order, Settings } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';
import { saveBase64Image } from '@/lib/upload';

export async function POST(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Secure check: verify that the user is the administrator via database role
    const adminCheck = await User.findById(session.id);
    if (!adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }

    const { action, payload } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required.' }, { status: 400 });
    }

    if (action === 'addScheme') {
      const { name, price, dailyReturnRate, days, totalReturn } = payload;
      if (!name || !price || !dailyReturnRate || !days || !totalReturn) {
        return NextResponse.json({ error: 'All fields are required to create a scheme.' }, { status: 400 });
      }

      const rateFraction = parseFloat(dailyReturnRate) >= 1 ? parseFloat(dailyReturnRate) / 100 : parseFloat(dailyReturnRate);

      await Scheme.create({
        name: name.trim(),
        price: parseFloat(price),
        daily_return_rate: rateFraction,
        days: parseInt(days),
        total_return: parseFloat(totalReturn)
      });

      return NextResponse.json({ success: true, message: `Investment scheme "${name}" created successfully!` });
    } 
    
    else if (action === 'deleteScheme') {
      const { schemeId } = payload;
      if (!schemeId) {
        return NextResponse.json({ error: 'Scheme ID is required.' }, { status: 400 });
      }

      await Scheme.deleteOne({ _id: schemeId });
      return NextResponse.json({ success: true, message: 'Investment scheme deleted successfully.' });
    }
    
    else if (action === 'editScheme') {
      const { schemeId, name, price, dailyReturnRate, days, totalReturn } = payload;
      if (!schemeId || !name || !price || !dailyReturnRate || !days || !totalReturn) {
        return NextResponse.json({ error: 'All fields are required to edit a scheme.' }, { status: 400 });
      }

      const rateFraction = parseFloat(dailyReturnRate) >= 1 ? parseFloat(dailyReturnRate) / 100 : parseFloat(dailyReturnRate);

      await Scheme.updateOne(
        { _id: schemeId },
        { 
          $set: {
            name: name.trim(),
            price: parseFloat(price),
            daily_return_rate: rateFraction,
            days: parseInt(days),
            total_return: parseFloat(totalReturn)
          } 
        }
      );

      return NextResponse.json({ success: true, message: `Investment scheme "${name}" updated successfully!` });
    }
    
    else if (action === 'approveTransaction') {
      const { transactionId } = payload;
      if (!transactionId) {
        return NextResponse.json({ error: 'Transaction ID is required.' }, { status: 400 });
      }

      const tx = await Transaction.findById(transactionId);
      if (!tx) {
        return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
      }

      if (tx.status !== 'pending' && tx.status !== 'confirmation_pending') {
        return NextResponse.json({ error: 'Transaction is already processed.' }, { status: 400 });
      }

      // Complete the transaction
      tx.status = 'completed';
      tx.updated_at = new Date();
      tx.resolved_at = new Date();
      tx.approved_by_admin_id = adminCheck._id;
      tx.approved_by_admin_username = adminCheck.username;
      await tx.save();

      // If it's a deposit, check if it was a Custom Scheme deposit or a normal deposit
      if (tx.type === 'deposit') {
        if (tx.amount >= 100 && tx.amount <= 500) {
          // Activate the custom scheme purchase order associated with the UTR
          await Order.updateOne(
            { user_id: tx.user_id, utr: tx.utr, status: 'confirmation_pending' },
            { $set: { status: 'active', last_payout_at: new Date() } }
          );
        } else {
          // Normal deposit credits the user's wallet balance
          await User.updateOne(
            { _id: tx.user_id },
            { $inc: { wallet_balance: tx.amount } }
          );
        }
        
        // Also unlock any associated virtual accounts
        if (tx.virtual_account_id) {
          await VirtualAccount.updateOne(
            { _id: tx.virtual_account_id },
            { $set: { is_locked: false, locked_until: null, locked_by_user_id: null } }
          );
        }
      }

      return NextResponse.json({ success: true, message: 'Transaction approved successfully.' });
    } 
    
    else if (action === 'rejectTransaction') {
      const { transactionId, rejectionReason } = payload;
      if (!transactionId) {
        return NextResponse.json({ error: 'Transaction ID is required.' }, { status: 400 });
      }

      const tx = await Transaction.findById(transactionId);
      if (!tx) {
        return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
      }

      if (tx.status !== 'pending' && tx.status !== 'confirmation_pending') {
        return NextResponse.json({ error: 'Transaction is already processed.' }, { status: 400 });
      }

      // Fail the transaction
      tx.status = 'failed';
      tx.updated_at = new Date();
      tx.resolved_at = new Date();
      tx.rejection_reason = rejectionReason || '';
      tx.approved_by_admin_id = adminCheck._id;
      tx.approved_by_admin_username = adminCheck.username;
      await tx.save();

      // If it's a deposit & custom scheme range, reject the custom order
      if (tx.type === 'deposit' && tx.amount >= 100 && tx.amount <= 500) {
        await Order.updateOne(
          { user_id: tx.user_id, utr: tx.utr, status: 'confirmation_pending' },
          { $set: { status: 'rejected' } }
        );
      }

      // If it's a withdrawal, refund user wallet balance (since we deduct it upon request)
      if (tx.type === 'withdrawal') {
        const refundAmount = Math.abs(tx.amount);
        await User.updateOne(
          { _id: tx.user_id },
          { $inc: { wallet_balance: refundAmount } }
        );
      }

      // If it's a deposit, unlock the virtual account
      if (tx.type === 'deposit' && tx.virtual_account_id) {
        await VirtualAccount.updateOne(
          { _id: tx.virtual_account_id },
          { $set: { is_locked: false, locked_until: null, locked_by_user_id: null } }
        );
      }

      return NextResponse.json({ success: true, message: 'Transaction rejected successfully.' });
    }

    else if (action === 'suspendUser') {
      const { userId } = payload;
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
      }
      const target = await User.findById(userId);
      if (!target) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }
      if (target.role === 'admin') {
        return NextResponse.json({ error: 'Cannot suspend an admin account.' }, { status: 403 });
      }
      await User.updateOne({ _id: userId }, { $set: { is_suspended: true } });
      return NextResponse.json({ success: true, message: `Account of "${target.username}" has been suspended.` });
    }

    else if (action === 'unsuspendUser') {
      const { userId } = payload;
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
      }
      const target = await User.findById(userId);
      if (!target) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }
      await User.updateOne({ _id: userId }, { $set: { is_suspended: false } });
      return NextResponse.json({ success: true, message: `Account of "${target.username}" has been reactivated.` });
    }

    else if (action === 'saveApkUrl') {
      const { apkUrl } = payload;
      if (!apkUrl) {
        return NextResponse.json({ error: 'APK URL is required.' }, { status: 400 });
      }
      await Settings.findOneAndUpdate(
        { key: 'apk_download_url' },
        { value: apkUrl.trim() },
        { upsert: true, new: true }
      );
      return NextResponse.json({ success: true, message: 'APK download link updated successfully!' });
    }

    else if (action === 'savePwaSettings') {
      const { name, shortName, themeColor, backgroundColor, icon, splashScreen, installPromptText, version, updateNotes } = payload;
      
      const iconUrl = icon ? await saveBase64Image(icon) : undefined;
      const splashScreenUrl = splashScreen ? await saveBase64Image(splashScreen) : undefined;

      const updates = [
        { key: 'pwa_name', value: name },
        { key: 'pwa_short_name', value: shortName },
        { key: 'pwa_theme_color', value: themeColor },
        { key: 'pwa_background_color', value: backgroundColor },
        { key: 'pwa_icon', value: iconUrl },
        { key: 'pwa_splash_screen', value: splashScreenUrl },
        { key: 'pwa_install_prompt_text', value: installPromptText },
        { key: 'pwa_version', value: version },
        { key: 'pwa_update_notes', value: updateNotes }
      ];

      for (const update of updates) {
        if (update.value !== undefined) {
          await Settings.findOneAndUpdate(
            { key: update.key },
            { value: String(update.value).trim() },
            { upsert: true, new: true }
          );
        }
      }

      return NextResponse.json({ success: true, message: 'PWA settings updated successfully!' });
    }

    else if (action === 'addPaymentAccount') {
      const { bankName, beneficiaryName, accountNumber, ifsc, upiId, qrCode, allowConcurrent } = payload;
      if (!beneficiaryName || !accountNumber) {
        return NextResponse.json({ error: 'Beneficiary Name and Account/UPI are required.' }, { status: 400 });
      }

      let qrCodeUrl = '';
      if (qrCode) {
        qrCodeUrl = await saveBase64Image(qrCode);
      }

      await VirtualAccount.create({
        bank_name: bankName || 'UPI',
        beneficiary_name: beneficiaryName,
        account_number: accountNumber,
        ifsc: ifsc || '',
        upi_id: upiId || '',
        qr_code: qrCodeUrl,
        allow_concurrent: !!allowConcurrent,
        is_enabled: true,
        last_assigned_at: new Date()
      });

      return NextResponse.json({ success: true, message: 'Payment account added successfully!' });
    }

    else if (action === 'togglePaymentAccountStatus') {
      const { id } = payload;
      const account = await VirtualAccount.findById(id);
      if (!account) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
      account.is_enabled = !account.is_enabled;
      await account.save();
      return NextResponse.json({ success: true, message: `Account status updated to ${account.is_enabled ? 'Enabled' : 'Disabled'}.` });
    }

    else if (action === 'togglePaymentAccountConcurrent') {
      const { id } = payload;
      const account = await VirtualAccount.findById(id);
      if (!account) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
      account.allow_concurrent = !account.allow_concurrent;
      await account.save();
      return NextResponse.json({ success: true, message: `Concurrent usage status updated to ${account.allow_concurrent ? 'Allowed' : 'Disallowed'}.` });
    }

    else if (action === 'deletePaymentAccount') {
      const { id } = payload;
      await VirtualAccount.deleteOne({ _id: id });
      return NextResponse.json({ success: true, message: 'Payment account deleted successfully.' });
    }

    return NextResponse.json({ error: 'Invalid admin action.' }, { status: 400 });
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: 'Failed to complete admin action.' }, { status: 500 });
  }
}
