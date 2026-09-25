import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class AlphabetQuickIndex extends StatefulWidget {
  final List<String> letters;
  final ValueChanged<String> onLetterSelected;

  const AlphabetQuickIndex({
    super.key,
    required this.letters,
    required this.onLetterSelected,
  });

  @override
  State<AlphabetQuickIndex> createState() => _AlphabetQuickIndexState();
}

class _AlphabetQuickIndexState extends State<AlphabetQuickIndex> {
  String? _activeLetter;

  void _triggerSelection(String letter) {
    if (_activeLetter != letter) {
      setState(() => _activeLetter = letter);
      widget.onLetterSelected(letter);
    }
  }

  void _clearActive() {
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) setState(() => _activeLetter = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.letters.isEmpty) return const SizedBox.shrink();

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Stack(
      alignment: Alignment.centerRight,
      children: [
        // The alphabet vertical column
        Container(
          width: 32,
          padding: const EdgeInsets.symmetric(vertical: 8),
          margin: const EdgeInsets.only(right: 4),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard.withOpacity(0.85) : Colors.white.withOpacity(0.85),
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(
              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: widget.letters.map((letter) {
              final isSelected = _activeLetter == letter;
              return GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTapDown: (_) => _triggerSelection(letter),
                onTapUp: (_) => _clearActive(),
                onTapCancel: () => _clearActive(),
                onVerticalDragUpdate: (details) {
                  // Drag scrubbing
                  _triggerSelection(letter);
                },
                onVerticalDragEnd: (_) => _clearActive(),
                child: Container(
                  height: 36, // Generous 36px effective tap target
                  alignment: Alignment.center,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    width: isSelected ? 28 : 22,
                    height: isSelected ? 28 : 22,
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.brand500 : Colors.transparent,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      letter,
                      style: TextStyle(
                        fontSize: isSelected ? 13 : 11,
                        fontWeight: FontWeight.w900,
                        color: isSelected
                            ? Colors.white
                            : (isDark ? AppColors.brand500 : AppColors.brand600),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),

        // Floating letter preview bubble
        if (_activeLetter != null)
          Positioned(
            left: 20,
            child: Material(
              color: Colors.transparent,
              child: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppColors.brand500,
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.brand500.withOpacity(0.4),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: Text(
                  _activeLetter!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
