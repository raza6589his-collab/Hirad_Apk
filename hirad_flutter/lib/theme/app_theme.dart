import 'package:flutter/material.dart';

/// Design tokens and theme system for Hirad Fitness Club.
/// Replicates the brand color palette, corner radii, and RTL typography.

class AppColors {
  // Brand Energy Orange
  static const Color brand50 = Color(0xFFFFF7ED);
  static const Color brand100 = Color(0xFFFFEDD5);
  static const Color brand500 = Color(0xFFF97316);
  static const Color brand600 = Color(0xFFEA580C);
  static const Color brand700 = Color(0xFFC2410C);

  // Status Colors
  static const Color paid = Color(0xFF10B981);
  static const Color paidLight = Color(0xFFECFDF5);
  static const Color debt = Color(0xFFF43F5E);
  static const Color debtLight = Color(0xFFFFF1F2);

  // Dark Theme Palette
  static const Color darkBg = Color(0xFF090D16);
  static const Color darkCard = Color(0xFF131A29);
  static const Color darkSubtle = Color(0xFF192236);
  static const Color darkBorder = Color(0xFF1F2B42);

  // Light Theme Palette
  static const Color lightBg = Color(0xFFF8FAFC);
  static const Color lightCard = Colors.white;
  static const Color lightSubtle = Color(0xFFF1F5F9);
  static const Color lightBorder = Color(0xFFE2E8F0);

  // Avatar deterministic gradient pairs
  static const List<List<Color>> avatarGradients = [
    [Color(0xFF2563EB), Color(0xFF4338CA)], // Blue to Indigo
    [Color(0xFF059669), Color(0xFF0F766E)], // Emerald to Teal
    [Color(0xFFD97706), Color(0xFFEA580C)], // Amber to Orange
    [Color(0xFFE11D48), Color(0xFFB91C1C)], // Rose to Red
    [Color(0xFF7C3AED), Color(0xFF6D28D9)], // Violet to Purple
    [Color(0xFF0891B2), Color(0xFF2563EB)], // Cyan to Blue
    [Color(0xFFC026D3), Color(0xFFBE185D)], // Fuchsia to Pink
    [Color(0xFF334155), Color(0xFF27272A)], // Slate to Zinc
  ];
}

class AppRadius {
  static const double sm = 8.0;
  static const double md = 14.0;
  static const double lg = 20.0;
  static const double xl = 28.0;
  static const double full = 999.0;
}

class AppTheme {
  static const String fontFamily = 'Vazirmatn';

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    fontFamily: fontFamily,
    scaffoldBackgroundColor: AppColors.lightBg,
    colorScheme: const ColorScheme.light(
      primary: AppColors.brand500,
      secondary: AppColors.brand600,
      surface: AppColors.lightCard,
      error: AppColors.debt,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: Color(0xFF0F172A),
      elevation: 0,
      scrolledUnderElevation: 1,
    ),
    cardTheme: CardThemeData(
      color: AppColors.lightCard,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        side: const BorderSide(color: AppColors.lightBorder),
      ),
    ),
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    fontFamily: fontFamily,
    scaffoldBackgroundColor: AppColors.darkBg,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.brand500,
      secondary: AppColors.brand600,
      surface: AppColors.darkCard,
      error: AppColors.debt,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.darkCard,
      foregroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 1,
    ),
    cardTheme: CardThemeData(
      color: AppColors.darkCard,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        side: const BorderSide(color: AppColors.darkBorder),
      ),
    ),
  );
}
