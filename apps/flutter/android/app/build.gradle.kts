import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Play Store upload signing (apps/flutter/DEPLOYMENT.md §3). key.properties
// is gitignored (android/.gitignore) and points at an upload keystore kept
// outside this repo — never committed. Falls back to the debug key when
// key.properties is absent (e.g. a fresh checkout, or CI without the
// secret wired up yet) so `flutter build apk/appbundle --release` keeps
// working for local testing either way.
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
val hasReleaseKeystore = keystorePropertiesFile.exists()
if (hasReleaseKeystore) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
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
        // Matches the Play Console app listing, which was created with
        // this package name and can't be renamed there after the fact
        // (was org.iqraspace.mobile until 2026-09-11, changed to match
        // before any release was ever uploaded — see DEPLOYMENT.md).
        // Distinct from apps/quran's Capacitor Android appId
        // (org.iqraspace.quran) so the two never look like the same app
        // side-by-side in a store listing. Treat as effectively
        // permanent now that it matches a real listing — see
        // apps/flutter/README.md.
        //
        // Deliberately different from `namespace` above: namespace only
        // has to match this module's Kotlin source package
        // (org/iqraspace/quran_flutter/MainActivity.kt) and is invisible
        // to end users/stores, so it was left as Flutter generated it.
        applicationId = "org.iqraspace.app"
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

    signingConfigs {
        if (hasReleaseKeystore) {
            create("release") {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }

    buildTypes {
        release {
            // Real upload-keystore signing when key.properties is present;
            // falls back to the debug key otherwise (see comment above).
            signingConfig = if (hasReleaseKeystore) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
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
