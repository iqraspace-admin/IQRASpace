import 'package:flutter/material.dart';

/// A small tap-to-increment counter badge, shown on the Duas reading
/// screen when enabled (see duaTasbeehEnabledProvider). Deliberately
/// ephemeral — not persisted, resets whenever the caller rebuilds it
/// with count 0 (DuaReadingScreen does this on every page change). With
/// no [target] it is a lightweight tally aid. When the dua carries a structured repeat count
/// ([target]), the badge shows `count/target` and is highlighted once the
/// target is reached (counting is never blocked).
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

  @override
  Widget build(BuildContext context) {
    final reached = target != null && count >= target!;
    return GestureDetector(
      onTap: onTap,
      onLongPress: onReset,
      child: Container(
        constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
        padding: target == null ? null : const EdgeInsets.symmetric(horizontal: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          color: color.withValues(alpha: reached ? 0.38 : 0.18),
          border: Border.all(color: color.withValues(alpha: reached ? 0.9 : 0.4), width: reached ? 2 : 1),
        ),
        child: Center(
          widthFactor: 1,
          heightFactor: 1,
          child: Text(
            target == null ? '$count' : '$count/$target',
            style: TextStyle(fontSize: target == null ? 16 : 14, fontWeight: FontWeight.w700, color: color),
          ),
        ),
      ),
    );
  }
}
