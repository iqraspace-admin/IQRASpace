package org.iqraspace.quran_flutter

import com.ryanheise.audioservice.AudioServiceActivity

// Was `FlutterActivity` — that left this Activity's Flutter engine
// separate from the one audio_service's background Service keeps
// running (see iqra_audio_handler.dart), so locking the screen tore
// down the Activity's engine (and whatever playback was driven from it)
// while unlocking recreated it fresh, reading as "audio pauses on lock,
// resumes on unlock." AudioServiceActivity only overrides
// provideFlutterEngine() to hand back that same shared engine — the
// documented fix for a custom Activity in audio_service's own README
// ("Custom Android activity" section) — everything else about this
// Activity is unchanged.
class MainActivity : AudioServiceActivity()
