/// Athlete data model for Hirad Fitness Club.
/// Strongly typed, null-safe, with JSON serialization.

class Athlete {
  static const List<String> trainingCategories = [
    'بدنسازی عمومی',
    'فیتنس و تناسب اندام',
    'برنامه اختصاصی مربی',
    'کاهش وزن و چربی‌سوزی',
    'پاورلیفتینگ و تمرینات قدرتی',
    'آمادگی مسابقات فیزیک / بادی‌بیلدینگ',
  ];

  final String id;
  final String firstName;
  final String lastName;
  final String? photoPath;
  final String mobileNumber;
  final String nationalCode;
  final String birthDateJalali;
  final String registrationDateJalali;
  final String trainingCategory;
  final int tuitionPaid;
  final int? tuitionUnpaid;
  final DateTime lastUpdated;
  final String? notes;

  const Athlete({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.photoPath,
    required this.mobileNumber,
    required this.nationalCode,
    required this.birthDateJalali,
    required this.registrationDateJalali,
    required this.trainingCategory,
    required this.tuitionPaid,
    this.tuitionUnpaid,
    required this.lastUpdated,
    this.notes,
  });

  String get fullName => '$firstName $lastName';

  bool get hasDebt => (tuitionUnpaid ?? 0) > 0;

  Map<String, dynamic> toJson() => {
        'id': id,
        'firstName': firstName,
        'lastName': lastName,
        'photoPath': photoPath,
        'mobileNumber': mobileNumber,
        'nationalCode': nationalCode,
        'birthDateJalali': birthDateJalali,
        'registrationDateJalali': registrationDateJalali,
        'trainingCategory': trainingCategory,
        'tuitionPaid': tuitionPaid,
        'tuitionUnpaid': tuitionUnpaid,
        'lastUpdated': lastUpdated.toIso8601String(),
        'notes': notes,
      };

  factory Athlete.fromJson(Map<String, dynamic> json) => Athlete(
        id: json['id'] as String,
        firstName: json['firstName'] as String,
        lastName: json['lastName'] as String,
        photoPath: json['photoPath'] as String?,
        mobileNumber: json['mobileNumber'] as String,
        nationalCode: json['nationalCode'] as String,
        birthDateJalali: json['birthDateJalali'] as String,
        registrationDateJalali: json['registrationDateJalali'] as String,
        trainingCategory: (json['trainingCategory'] as String?) ?? 'بدنسازی عمومی',
        tuitionPaid: (json['tuitionPaid'] as num).toInt(),
        tuitionUnpaid: (json['tuitionUnpaid'] as num?)?.toInt(),
        lastUpdated: DateTime.tryParse(json['lastUpdated'] as String? ?? '') ?? DateTime.now(),
        notes: json['notes'] as String?,
      );

  Athlete copyWith({
    String? id,
    String? firstName,
    String? lastName,
    String? photoPath,
    String? mobileNumber,
    String? nationalCode,
    String? birthDateJalali,
    String? registrationDateJalali,
    String? trainingCategory,
    int? tuitionPaid,
    int? tuitionUnpaid,
    DateTime? lastUpdated,
    String? notes,
  }) {
    return Athlete(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      photoPath: photoPath ?? this.photoPath,
      mobileNumber: mobileNumber ?? this.mobileNumber,
      nationalCode: nationalCode ?? this.nationalCode,
      birthDateJalali: birthDateJalali ?? this.birthDateJalali,
      registrationDateJalali: registrationDateJalali ?? this.registrationDateJalali,
      trainingCategory: trainingCategory ?? this.trainingCategory,
      tuitionPaid: tuitionPaid ?? this.tuitionPaid,
      tuitionUnpaid: tuitionUnpaid ?? this.tuitionUnpaid,
      lastUpdated: lastUpdated ?? this.lastUpdated,
      notes: notes ?? this.notes,
    );
  }
}
