plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "org.iqraspace.quran_flutter"
    compileSdk = flutter.compileSdkVersion
    // NOT set to flutter.ndkVersion: this app has no native (C/C++/JNI)
    // code and none of its plugins (just_audio, path_provider, hive) need
    // one either — pinning an NDK version here just makes Gradle try to
    // auto-download it via `sdkmanager`, which crashes on this machine
    // (JDK 25 vs. the bundled cmdline-tools sdkmanager.bat — a local
    // toolchain incompatibility, not an app problem). Leaving it unset
    // lets AGP skip NDK resolution entirely since nothing here needs it.

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // Distinct from apps/quran's Capacitor Android appId
        // (org.iqraspace.quran) so the two never look like the same app
        // side-by-side in a store listing. Treat as effectively
        // permanent once published — see apps/flutter/README.md.
        //
        // Deliberately different from `namespace` above: namespace only
        // has to match this module's Kotlin source package
        // (org/iqraspace/quran_flutter/MainActivity.kt) and is invisible
        // to end users/stores, so it was left as Flutter generated it.
        applicationId = "org.iqraspace.mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
