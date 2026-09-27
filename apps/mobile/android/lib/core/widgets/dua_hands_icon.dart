import 'package:flutter/material.dart';

/// Two open hands raised together for dua (supplication) — the
/// traditional posture, distinct from Material's single-hand icons
/// (`front_hand`, `pan_tool`, ...). Built from that same vetted
/// `front_hand` glyph, mirrored into a pair, rather than a hand-drawn
/// shape — reusing well-formed hand artwork reads far more clearly at
/// small sizes than an original silhouette would.
class DuaHandsIcon extends StatelessWidget {
  /// Defaults to the ambient `IconTheme` size (as a plain `Icon` would),
  /// so this drops into a `NavigationDestination` the same way
  /// `Icon(Icons.xxx)` does.
  final double? size;
  final Color? color;
  final bool filled;

  const DuaHandsIcon({this.size, this.color, this.filled = false, super.key});

  @override
  Widget build(BuildContext context) {
    final iconTheme = IconTheme.of(context);
    final resolvedSize = size ?? iconTheme.size ?? 24;
    final resolvedColor = color ?? iconTheme.color ?? DefaultTextStyle.of(context).style.color!;
    final iconData = filled ? Icons.front_hand : Icons.front_hand_outlined;
    final handSize = resolvedSize * 0.46;

    return SizedBox(
      width: resolvedSize,
      height: resolvedSize,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Icon(iconData, size: handSize, color: resolvedColor),
          Transform(
            alignment: Alignment.center,
            transform: Matrix4.identity()..scaleByDouble(-1.0, 1.0, 1.0, 1.0),
            child: Icon(iconData, size: handSize, color: resolvedColor),
          ),
        ],
      ),
    );
  }
}
