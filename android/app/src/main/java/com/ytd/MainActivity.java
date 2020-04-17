package com.ytd;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;
import android.util.Log;
import android.os.Bundle;
import android.content.Intent;
import android.app.Activity;
import android.os.Handler;
import android.os.Looper;
import java.util.Arrays;
import java.util.ArrayList;

public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript. This is
   * used to schedule rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "ytd";
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegate(this, getMainComponentName()) {
      private ReactRootView mReactRootView;

      @Override
      protected ReactRootView createRootView() {
        mReactRootView = new RNGestureHandlerEnabledRootView(MainActivity.this);
        return mReactRootView;
      }

      @Override
      protected void onCreate(Bundle savedInstanceBundle) {
        super.onCreate(savedInstanceBundle);
      }

      // undo
      @Override
      protected void onResume() {
        Intent intent = getPlainActivity().getIntent();
        String action = intent.getAction();
        String data = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (mReactRootView != null && data != null && Intent.ACTION_SEND.equals(action)) {
          Bundle updatedProps = mReactRootView.getAppProperties();
          if (updatedProps == null) {
            updatedProps = new Bundle();
          }
          updatedProps.putCharSequence("sharedUrl", data);
          mReactRootView.setAppProperties(updatedProps);
        }
        super.onResume();
      }

      @Override
      public boolean onNewIntent(Intent intent) {
        setIntent(intent);
        return super.onNewIntent(intent);
      }

    };
  }

}
