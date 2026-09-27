/// Athlete, Payment, and Attendance models for Hirad Fitness Club.
/// Strongly typed, null-safe, with JSON serialization.

class PaymentRecord {
  final String id;
  final String date; // Jalali date (e.g. 1403/07/06)
  final int amount; // in Tomans
  final String type; // 'payment' or 'charge'
  final String title;
  final String? note;

  const PaymentRecord({
    required this.id,
    required this.date,
    required this.amount,
    required this.type,
    required this.title,
    this.note,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'date': date,
        'amount': amount,
        'type': type,
        'title': title,
        'note': note,
      };

  factory PaymentRecord.fromJson(Map<String, dynamic> json) => PaymentRecord(
        id: json['id'] as String,
        date: json['date'] as String,
        amount: (json['amount'] as num).toInt(),
        type: (json['type'] as String?) ?? 'payment',
        title: (json['title'] as String?) ?? 'واریز شهریه',
        note: json['note'] as String?,
      );
}

class AttendanceRecord {
  final String id;
  final String date; // Jalali date
  final String time; // HH:mm
  final int sessionNumber;
  final String? note;

  const AttendanceRecord({
    required this.id,
    required this.date,
    required this.time,
    required this.sessionNumber,
    this.note,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'date': date,
        'time': time,
        'sessionNumber': sessionNumber,
        'note': note,
      };

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) => AttendanceRecord(
        id: json['id'] as String,
        date: json['date'] as String,
        time: (json['time'] as String?) ?? '18:00',
        sessionNumber: (json['sessionNumber'] as num?)?.toInt() ?? 1,
        note: json['note'] as String?,
      );
}

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
  final int monthlyFee;
  final int tuitionPaid;
  final int? tuitionUnpaid;
  final List<PaymentRecord> payments;
  final List<AttendanceRecord> attendances;
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
    this.monthlyFee = 2000000,
    required this.tuitionPaid,
    this.tuitionUnpaid,
    this.payments = const [],
    this.attendances = const [],
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
        'monthlyFee': monthlyFee,
        'tuitionPaid': tuitionPaid,
        'tuitionUnpaid': tuitionUnpaid,
        'payments': payments.map((p) => p.toJson()).toList(),
        'attendances': attendances.map((a) => a.toJson()).toList(),
        'lastUpdated': lastUpdated.toIso8601String(),
        'notes': notes,
      };

  factory Athlete.fromJson(Map<String, dynamic> json) {
    final paid = (json['tuitionPaid'] as num?)?.toInt() ?? 0;
    final unpaid = (json['tuitionUnpaid'] as num?)?.toInt();
    final mFee = (json['monthlyFee'] as num?)?.toInt() ?? (paid + (unpaid ?? 0));

    final rawPayments = json['payments'] as List<dynamic>?;
    final paymentsList = rawPayments != null
        ? rawPayments.map((p) => PaymentRecord.fromJson(p as Map<String, dynamic>)).toList()
        : (paid > 0
            ? [
                PaymentRecord(
                  id: 'init-${json['id']}',
                  date: (json['registrationDateJalali'] as String?) ?? '1403/01/01',
                  amount: paid,
                  type: 'payment',
                  title: 'پرداخت اولیه هنگام ثبت‌نام',
                )
              ]
            : <PaymentRecord>[]);

    final rawAttendances = json['attendances'] as List<dynamic>?;
    final attendancesList = rawAttendances != null
        ? rawAttendances.map((a) => AttendanceRecord.fromJson(a as Map<String, dynamic>)).toList()
        : <AttendanceRecord>[];

    return Athlete(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      photoPath: json['photoPath'] as String?,
      mobileNumber: json['mobileNumber'] as String,
      nationalCode: json['nationalCode'] as String,
      birthDateJalali: json['birthDateJalali'] as String,
      registrationDateJalali: json['registrationDateJalali'] as String,
      trainingCategory: (json['trainingCategory'] as String?) ?? 'بدنسازی عمومی',
      monthlyFee: mFee > 0 ? mFee : 2000000,
      tuitionPaid: paid,
      tuitionUnpaid: unpaid ?? (mFee > paid ? mFee - paid : 0),
      payments: paymentsList,
      attendances: attendancesList,
      lastUpdated: DateTime.tryParse(json['lastUpdated'] as String? ?? '') ?? DateTime.now(),
      notes: json['notes'] as String?,
    );
  }

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
    int? monthlyFee,
    int? tuitionPaid,
    int? tuitionUnpaid,
    List<PaymentRecord>? payments,
    List<AttendanceRecord>? attendances,
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
      monthlyFee: monthlyFee ?? this.monthlyFee,
      tuitionPaid: tuitionPaid ?? this.tuitionPaid,
      tuitionUnpaid: tuitionUnpaid ?? this.tuitionUnpaid,
      payments: payments ?? this.payments,
      attendances: attendances ?? this.attendances,
      lastUpdated: lastUpdated ?? this.lastUpdated,
      notes: notes ?? this.notes,
    );
  }
}
