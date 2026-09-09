import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/models.dart';

class ApiService {
  static String get baseUrl {
    if (kIsWeb) return '/api';
    return 'https://mock.wegenz.in/api';
  }

  static String resolveImageUrl(String tokenOrPath) {
    final trimmed = tokenOrPath.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.startsWith('/api/img/')) {
      return '$baseUrl${trimmed.substring(4)}';
    }
    if (trimmed.startsWith('/img/')) {
      return '$baseUrl$trimmed';
    }
    return '$baseUrl/img/$trimmed';
  }

  static Future<List<InfinitePracticeSubject>> fetchSubjects(String batchId) async {
    final uri = Uri.parse('$baseUrl/subjects?batchId=${Uri.encodeComponent(batchId)}');
    final response = await http.get(uri);

    if (response.statusCode != 200) {
      throw Exception('Failed to load subjects: ${response.statusCode}');
    }

    final data = jsonDecode(response.body);
    final subjectsList = data['data']?['subjects'] as List<dynamic>? ?? [];
    return subjectsList
        .map((s) => InfinitePracticeSubject.fromJson(s as Map<String, dynamic>))
        .toList();
  }

  static Future<List<InfinitePracticeChapter>> fetchChapters(String batchId, String subjectId) async {
    final uri = Uri.parse(
        '$baseUrl/chapters?batchId=${Uri.encodeComponent(batchId)}&subjectId=${Uri.encodeComponent(subjectId)}');
    final response = await http.get(uri);

    if (response.statusCode != 200) {
      throw Exception('Failed to load chapters: ${response.statusCode}');
    }

    final data = jsonDecode(response.body);
    final chaptersList = data['data'] as List<dynamic>? ?? [];
    return chaptersList
        .map((c) => InfinitePracticeChapter.fromJson(c as Map<String, dynamic>))
        .toList();
  }

  static Future<List<InfinitePracticeQuestion>> fetchPracticeQuestions({
    required String batchId,
    required List<String> subjects,
    required List<String> chapters,
    required int count,
    List<int>? types,
    List<int>? difficulty,
    Map<String, int>? subjectAllocations,
  }) async {
    if (subjects.length > 1 && subjectAllocations != null && subjectAllocations.isNotEmpty) {
      final List<InfinitePracticeQuestion> aggregated = [];

      for (final subject in subjects) {
        final subCount = subjectAllocations[subject] ?? 0;
        if (subCount <= 0) continue;

        var qParams = 'grade=${Uri.encodeComponent(batchId)}&count=$subCount&subjects=${Uri.encodeComponent(subject)}';
        if (chapters.isNotEmpty) {
          qParams += '&chapters=${Uri.encodeComponent(chapters.join(","))}';
        }
        if (types != null && types.isNotEmpty) {
          qParams += '&types=${Uri.encodeComponent(types.join(","))}';
        }
        if (difficulty != null && difficulty.isNotEmpty) {
          qParams += '&difficulty=${Uri.encodeComponent(difficulty.join(","))}';
        }

        try {
          final uri = Uri.parse('$baseUrl/random?$qParams');
          final response = await http.get(uri);
          if (response.statusCode == 200) {
            final data = jsonDecode(response.body);
            final qList = (data['questions'] as List<dynamic>?) ?? [];
            for (final item in qList) {
              final qObj = item['question'] ?? item;
              aggregated.add(InfinitePracticeQuestion.fromJson(qObj as Map<String, dynamic>));
            }
          }
        } catch (_) {}
      }

      if (aggregated.isNotEmpty) {
        return aggregated;
      }
    }

    var qParams = 'grade=${Uri.encodeComponent(batchId)}&count=$count';
    if (subjects.isNotEmpty) {
      qParams += '&subjects=${Uri.encodeComponent(subjects.join(","))}';
    }
    if (chapters.isNotEmpty) {
      qParams += '&chapters=${Uri.encodeComponent(chapters.join(","))}';
    }
    if (types != null && types.isNotEmpty) {
      qParams += '&types=${Uri.encodeComponent(types.join(","))}';
    }
    if (difficulty != null && difficulty.isNotEmpty) {
      qParams += '&difficulty=${Uri.encodeComponent(difficulty.join(","))}';
    }

    final uri = Uri.parse('$baseUrl/random?$qParams');
    final response = await http.get(uri);

    if (response.statusCode != 200) {
      throw Exception('Failed to generate practice test: ${response.statusCode}');
    }

    final data = jsonDecode(response.body);
    final qList = (data['questions'] as List<dynamic>?) ?? [];
    return qList.map((item) {
      final qObj = item['question'] ?? item;
      return InfinitePracticeQuestion.fromJson(qObj as Map<String, dynamic>);
    }).toList();
  }

  static Future<String?> shareTest({
    required String batchId,
    required String batchName,
    required List<String> subjectNames,
    required int timeLimitSeconds,
    required List<InfinitePracticeQuestion> questions,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/share');
      final payload = jsonEncode({
        'batchId': batchId,
        'batchName': batchName,
        'subjectNames': subjectNames,
        'timeLimitSeconds': timeLimitSeconds,
        'questions': questions
            .map((q) => {
                  'questionId': q.questionId,
                  'content': q.content,
                  'type': q.type,
                  'difficulty': q.difficulty,
                  'options': q.options.map((o) => {'text': o.text, 'isCorrect': o.isCorrect}).toList(),
                  'solutions': q.solutions.map((s) => {'text': s.text, 'otherSolution': s.otherSolution}).toList(),
                  'chapterName': q.chapterName,
                  'subjectName': q.subjectName,
                  'numericAnswer': q.numericAnswer,
                })
            .toList(),
      });

      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: payload,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['code']?.toString();
      }
    } catch (_) {}
    return null;
  }
}
