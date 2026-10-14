import 'dart:math' as math;

import 'package:flutter/material.dart';

/// The tap-to-count tasbeeh badge on the Duas reading screen when enabled
/// (see duaTasbeehEnabledProvider). Deliberately ephemeral — not persisted,
/// resets whenever the caller rebuilds it with count 0 (DuaReadingScreen
/// does this on every page change).
///
/// With no [target] it is a plain tally pill: every tap increments forever,
/// long-press resets.
///
/// When the dua carries a structured repeat count ([target]) it is a
/// circular button whose ring fills as progress — 1/3 of the ring after one
/// tap of three, the whole ring after the last — animated smoothly between
/// taps. Once the target is reached the ring stays full and the button turns
/// into a reset button: the next tap calls [onReset] (back to 0) instead of
/// [onTap]. Long-press resets at any point.
class TasbeehCounterBadge extends StatelessWidget {
  final int count;
  final int? target;
  final Color color;
  final VoidCallback onTap;
  final VoidCallback onReset;

  const TasbeehCounterBadge({
    required this.count,
    this.target,
    required this.color,
    required this.onTap,
    required this.onReset,
    super.key,
  });

  static const double _diameter = 60;

  @override
  Widget build(BuildContext context) {
    final target = this.target;
    if (target == null) return _plain();

    final reached = count >= target;
    final progress = (count / target).clamp(0.0, 1.0);

    return Semantics(
      button: true,
      label: '$count/$target',
      child: GestureDetector(
        onTap: reached ? onReset : onTap,
        onLongPress: onReset,
        child: TweenAnimationBuilder<double>(
          tween: Tween<double>(end: progress),
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOutCubic,
          builder: (context, animated, child) => CustomPaint(
            size: const Size(_diameter, _diameter),
            painter: _RingPainter(progress: animated, color: color),
            child: child,
          ),
          child: SizedBox(
            width: _diameter,
            height: _diameter,
            child: Center(
              child: reached
                  ? Icon(Icons.refresh, color: color, size: 28)
                  : Text(
                      '$count/$target',
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: color),
                    ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _plain() {
    return GestureDetector(
      onTap: onTap,
      onLongPress: onReset,
      child: Container(
        constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          color: color.withValues(alpha: 0.18),
          border: Border.all(color: color.withValues(alpha: 0.4)),
        ),
        child: Center(
          widthFactor: 1,
          heightFactor: 1,
          child: Text(
            '$count',
            style: TextStyle(
                fontSize: 16, fontWeight: FontWeight.w700, color: color),
          ),
        ),
      ),
    );
  }
}

/// Filled disc + faint full track + a progress arc clockwise from 12 o'clock.
class _RingPainter extends CustomPainter {
  final double progress;
  final Color color;

  const _RingPainter({required this.progress, required this.color});

  static const double _stroke = 5;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = (size.shortestSide - _stroke) / 2;

    canvas.drawCircle(center, radius,
        Paint()..color = color.withValues(alpha: progress >= 1 ? 0.30 : 0.14));

    final track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = _stroke
      ..color = color.withValues(alpha: 0.25);
    canvas.drawCircle(center, radius, track);

    if (progress <= 0) return;
    final arc = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = _stroke
      ..strokeCap = progress >= 1 ? StrokeCap.butt : StrokeCap.round
      ..color = color;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      arc,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.progress != progress || old.color != color;
}
