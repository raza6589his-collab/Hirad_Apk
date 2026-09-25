import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/athlete.dart';

/// Athlete Repository for offline-first persistence.
/// Starts with an empty roster ready for the coach to register new athletes.

class AthleteRepository {
  static const String _storageKey = 'hirad_fitness_athletes_v2';

  Future<List<Athlete>> getAthletes() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);
      if (raw == null || raw.isEmpty) {
        await saveAll([]);
        return [];
      }
      final decoded = jsonDecode(raw) as List<dynamic>;
      return decoded.map((e) => Athlete.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> saveAll(List<Athlete> athletes) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonList = athletes.map((a) => a.toJson()).toList();
    await prefs.setString(_storageKey, jsonEncode(jsonList));
  }

  Future<void> addAthlete(Athlete athlete) async {
    final list = await getAthletes();
    list.insert(0, athlete);
    await saveAll(list);
  }

  Future<void> updateAthlete(Athlete athlete) async {
    final list = await getAthletes();
    final index = list.indexWhere((a) => a.id == athlete.id);
    if (index != -1) {
      list[index] = athlete;
      await saveAll(list);
    }
  }

  Future<void> deleteAthlete(String id) async {
    final list = await getAthletes();
    list.removeWhere((a) => a.id == id);
    await saveAll(list);
  }

  Future<List<Athlete>> clearAll() async {
    await saveAll([]);
    return [];
  }
}
