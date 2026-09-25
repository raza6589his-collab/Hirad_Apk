import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class ThemeToggleButton extends StatelessWidget {
  final bool isDark;
  final VoidCallback onToggle;

  const ThemeToggleButton({
    super.key,
    required this.isDark,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isDark ? AppColors.darkSubtle : Colors.grey[100],
      ),
      child: IconButton(
        iconSize: 20,
        padding: EdgeInsets.zero,
        tooltip: isDark ? 'حالت روز' : 'حالت شب',
        onPressed: onToggle,
        icon: AnimatedSwitcher(
          duration: const Duration(milliseconds: 350),
          transitionBuilder: (child, anim) {
            return RotationTransition(
              turns: child.key == const ValueKey('moon')
                  ? Tween<double>(begin: 0.75, end: 1.0).animate(anim)
                  : Tween<double>(begin: 0.25, end: 0.0).animate(anim),
              child: FadeTransition(opacity: anim, child: child),
            );
          },
          child: isDark
              ? const Icon(
                  Icons.nightlight_round,
                  key: ValueKey('moon'),
                  color: Colors.amber,
                )
              : const Icon(
                  Icons.wb_sunny_rounded,
                  key: ValueKey('sun'),
                  color: Colors.orange,
                ),
        ),
      ),
    );
  }
}
