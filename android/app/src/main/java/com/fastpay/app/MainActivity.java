package com.fastpay.app;

import android.os.Bundle;
import android.util.Log;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        
        // Ensure bridge and WebView are initialized
        if (this.bridge != null && this.bridge.getWebView() != null) {
            final WebView webView = this.bridge.getWebView();
            
            // 1. Expose Firebase/GMS configuration status programmatically
            int checkPresence = getResources().getIdentifier("google_app_id", "string", getPackageName());
            final boolean isFirebaseConfigured = (checkPresence != 0);
            Log.i("MainActivity", "Firebase config check (google_app_id presence): " + isFirebaseConfigured);
            
            webView.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public boolean isConfigured() {
                    return isFirebaseConfigured;
                }
            }, "AndroidFirebase");
            
            // 2. Configure robust WebView Settings (JavaScript, Storage, Mixed Content, Cookies)
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);
            
            // 3. Set custom WebViewClient extending BridgeWebViewClient for robust error page handling
            webView.setWebViewClient(new BridgeWebViewClient(this.bridge) {
                @Override
                public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                    super.onReceivedError(view, request, error);
                    // Handle main frame load errors (connection loss, dns failure, etc.)
                    if (request.isForMainFrame()) {
                        Log.e("MainActivity", "WebView Error on main frame: " + error.getDescription() + " (code: " + error.getErrorCode() + ")");
                        view.loadUrl("file:///android_asset/public/error.html");
                    }
                }

                @Override
                public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                    super.onReceivedError(view, errorCode, description, failingUrl);
                    // Fallback for API < 23 (where request is not available)
                    Log.e("MainActivity", "WebView Error (Legacy) on URL: " + failingUrl + " - " + description + " (code: " + errorCode + ")");
                    // Avoid redirecting assets/images (only handle page navigations)
                    if (failingUrl != null && (failingUrl.startsWith("http://") || failingUrl.startsWith("https://")) && !failingUrl.contains(".")) {
                        view.loadUrl("file:///android_asset/public/error.html");
                    } else if (failingUrl != null && failingUrl.equals("https://quicklyearning.info/")) {
                        view.loadUrl("file:///android_asset/public/error.html");
                    }
                }
            });
        }
    }
}
