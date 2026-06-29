import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';

export async function GET(request) {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection not ready.' }, { status: 500 });
    }

    const collection = db.collection('virtualaccounts');
    const indexes = await collection.indexes();

    let message = 'No stale index "accountNumber_1" found.';
    const hasStaleIndex = indexes.some(idx => idx.name === 'accountNumber_1');

    if (hasStaleIndex) {
      await collection.dropIndex('accountNumber_1');
      message = 'Stale unique index "accountNumber_1" dropped successfully!';
    }

    // Fetch updated index list
    const updatedIndexes = await collection.indexes();

    return NextResponse.json({
      success: true,
      message,
      previousIndexes: indexes,
      currentIndexes: updatedIndexes
    });
  } catch (error) {
    console.error('Clean DB error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
