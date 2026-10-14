import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_flutter/features/supplications/presentation/widgets/tasbeeh_counter_badge.dart';

/// Hosts the badge the way DuaReadingScreen does: the parent owns the count.
class _Host extends StatefulWidget {
  final int? target;
  const _Host(this.target);

  @override
  State<_Host> createState() => _HostState();
}

class _HostState extends State<_Host> {
  int count = 0;

  @override
  Widget build(BuildContext context) => MaterialApp(
        home: Scaffold(
          body: Center(
            child: TasbeehCounterBadge(
              count: count,
              target: widget.target,
              color: Colors.teal,
              onTap: () => setState(() => count++),
              onReset: () => setState(() => count = 0),
            ),
          ),
        ),
      );
}

/// The arc painted around the button, 0..1 (read off the painter).
double ringProgress(WidgetTester tester) {
  final paint = tester
      .widgetList<CustomPaint>(find.byType(CustomPaint))
      .firstWhere((p) => p.painter != null);
  return (paint.painter as dynamic).progress as double;
}

void main() {
  testWidgets(
      'with a count of 3 the ring fills 1/3, 2/3, then full, then the button resets',
      (tester) async {
    await tester.pumpWidget(const _Host(3));
    await tester.pumpAndSettle();
    expect(find.text('0/3'), findsOneWidget);
    expect(ringProgress(tester), 0);

    await tester.tap(find.byType(TasbeehCounterBadge));
    await tester.pumpAndSettle();
    expect(find.text('1/3'), findsOneWidget);
    expect(ringProgress(tester), closeTo(1 / 3, 0.001));

    await tester.tap(find.byType(TasbeehCounterBadge));
    await tester.pumpAndSettle();
    expect(find.text('2/3'), findsOneWidget);
    expect(ringProgress(tester), closeTo(2 / 3, 0.001));
    expect(find.byIcon(Icons.refresh), findsNothing);

    await tester.tap(find.byType(TasbeehCounterBadge));
    await tester.pumpAndSettle();
    expect(ringProgress(tester), 1.0);
    expect(find.byIcon(Icons.refresh), findsOneWidget);

    // At the target a tap does NOT keep counting: it resets to 0.
    await tester.tap(find.byType(TasbeehCounterBadge));
    await tester.pumpAndSettle();
    expect(find.text('0/3'), findsOneWidget);
    expect(ringProgress(tester), 0);
    expect(find.byIcon(Icons.refresh), findsNothing);
  });

  testWidgets('the ring animates between taps instead of jumping',
      (tester) async {
    await tester.pumpWidget(const _Host(4));
    await tester.pumpAndSettle();
    await tester.tap(find.byType(TasbeehCounterBadge));
    await tester.pump(); // starts the animation clock
    await tester.pump(const Duration(milliseconds: 100));
    final mid = ringProgress(tester);
    expect(mid, greaterThan(0));
    expect(mid, lessThan(0.25));
    await tester.pumpAndSettle();
    expect(ringProgress(tester), closeTo(0.25, 0.001));
  });

  testWidgets('long-press resets part-way through', (tester) async {
    await tester.pumpWidget(const _Host(3));
    await tester.tap(find.byType(TasbeehCounterBadge));
    await tester.pumpAndSettle();
    await tester.longPress(find.byType(TasbeehCounterBadge));
    await tester.pumpAndSettle();
    expect(find.text('0/3'), findsOneWidget);
  });

  testWidgets(
      'with no count every tap just increments, with no ring and no reset',
      (tester) async {
    await tester.pumpWidget(const _Host(null));
    for (var i = 1; i <= 12; i++) {
      await tester.tap(find.byType(TasbeehCounterBadge));
      await tester.pump();
    }
    expect(find.text('12'), findsOneWidget);
    expect(find.byIcon(Icons.refresh), findsNothing);
    expect(find.textContaining('/'), findsNothing);
  });
}
