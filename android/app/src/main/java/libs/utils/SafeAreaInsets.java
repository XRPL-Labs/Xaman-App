// Create this as a separate file: SafeAreaInsets.java
package com.xrpllabs.xumm;

public class SafeAreaInsets {
    private static int statusBarHeight = 0;
    private static int navigationBarHeight = 0;
    private static int navigationBarLeft = 0;
    private static int navigationBarRight = 0;
    private static int displayCutoutTop = 0;
    private static boolean hasVirtualNavigation = false;
    
    public static void setInsets(int statusTop, int navBottom, int navLeft, int navRight, int cutoutTop) {
        android.util.Log.d("EdgeToEdge", "SET Status bar top: " + statusTop);
        statusBarHeight = statusTop;
        navigationBarHeight = navBottom;
        navigationBarLeft = navLeft;
        navigationBarRight = navRight;
        displayCutoutTop = cutoutTop;
        hasVirtualNavigation = navBottom > 0 || navLeft > 0 || navRight > 0;
    }
    
    // Getters for React Native bridge
    public static int getStatusBarHeight() { return statusBarHeight; }
    public static int getNavigationBarHeight() { return navigationBarHeight; }
    public static boolean hasVirtualNavigation() { return hasVirtualNavigation; }
    public static int getSafeAreaTop() { return Math.max(statusBarHeight, displayCutoutTop); }
    public static int getSafeAreaBottom() { return navigationBarHeight; }
}
