import 'dart:io';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

enum AvatarSize { sm, md, lg, xl }

class AthleteAvatar extends StatelessWidget {
  final String firstName;
  final String lastName;
  final String? photoPath;
  final AvatarSize size;
  final String? heroTag;
  final bool? hasDebt;
  final bool showStatusBadge;
  final VoidCallback? onTap;

  const AthleteAvatar({
    super.key,
    required this.firstName,
    required this.lastName,
    this.photoPath,
    this.size = AvatarSize.md,
    this.heroTag,
    this.hasDebt,
    this.showStatusBadge = false,
    this.onTap,
  });

  static String getInitials(String fName, String lName) {
    final f = fName.trim().isNotEmpty ? fName.trim()[0] : '';
    final l = lName.trim().isNotEmpty ? lName.trim()[0] : '';
    final res = '$f $l'.trim();
    return res.isEmpty ? '؟' : res;
  }

  static int getColorIndex(String name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = name.codeUnitAt(i) + ((hash << 5) - hash);
    }
    return hash.abs() % AppColors.avatarGradients.length;
  }

  @override
  Widget build(BuildContext context) {
    final dimension = switch (size) {
      AvatarSize.sm => 36.0,
      AvatarSize.md => 48.0,
      AvatarSize.lg => 64.0,
      AvatarSize.xl => 96.0,
    };

    final fontSize = switch (size) {
      AvatarSize.sm => 13.0,
      AvatarSize.md => 16.0,
      AvatarSize.lg => 22.0,
      AvatarSize.xl => 32.0,
    };

    final badgeSize = switch (size) {
      AvatarSize.sm => 10.0,
      AvatarSize.md => 13.0,
      AvatarSize.lg => 16.0,
      AvatarSize.xl => 20.0,
    };

    final initials = getInitials(firstName, lastName);
    final gradientColors = AppColors.avatarGradients[getColorIndex('$firstName $lastName')];

    Widget circleContent = Container(
      width: dimension,
      height: dimension,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: (photoPath == null || photoPath!.isEmpty)
            ? LinearGradient(
                colors: gradientColors,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : null,
        boxShadow: size == AvatarSize.xl
            ? [
                BoxShadow(
                  color: AppColors.brand500.withOpacity(0.25),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                )
              ]
            : null,
      ),
      child: ClipOval(
        child: (photoPath != null && photoPath!.isNotEmpty)
            ? (photoPath!.startsWith('http')
                ? Image.network(photoPath!, fit: BoxFit.cover)
                : Image.file(File(photoPath!), fit: BoxFit.cover))
            : Center(
                child: Text(
                  initials,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: fontSize,
                    fontWeight: FontWeight.bold,
                    fontFamily: AppTheme.fontFamily,
                  ),
                ),
              ),
      ),
    );

    if (heroTag != null) {
      circleContent = Hero(
        tag: heroTag!,
        child: circleContent,
      );
    }

    if (!showStatusBadge || hasDebt == null) {
      return GestureDetector(onTap: onTap, child: circleContent);
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          circleContent,
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              width: badgeSize,
              height: badgeSize,
              decoration: BoxDecoration(
                color: hasDebt! ? AppColors.debt : AppColors.paid,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isDark ? AppColors.darkCard : Colors.white,
                  width: 2.0,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
