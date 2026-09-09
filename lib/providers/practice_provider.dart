import 'package:flutter/material.dart';
import '../constants/constants.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class PracticeProvider extends ChangeNotifier {
  BatchTrack _selectedBatch = kBatches[1]; // Default to 12th JEE
  List<InfinitePracticeSubject> _subjects = [];
  bool _isLoadingSubjects = false;
  String? _subjectsError;

  final Set<String> _selectedSubjectIds = {};
  final Map<String, List<InfinitePracticeChapter>> _chaptersBySubject = {};
  final Map<String, bool> _isLoadingChapters = {};
  final Set<String> _selectedChapterIds = {};

  int _questionCount = 10;
  bool _isEqualSplit = true;
  final Map<String, int> _customSubjectCounts = {};

  final Set<int> _selectedDifficulties = {1, 2, 3}; // 1: Easy, 2: Medium, 3: Hard
  final Set<int> _selectedQuestionTypes = {1, 2, 3}; // 1: Single, 2: Multiple, 3: Numerical
  int _timeLimitPerQuestionSeconds = 0; // 0: No limit, 60: 1m, 120: 2m, 180: 3m

  // Getters
  BatchTrack get selectedBatch => _selectedBatch;
  List<InfinitePracticeSubject> get subjects => _subjects;
  bool get isLoadingSubjects => _isLoadingSubjects;
  String? get subjectsError => _subjectsError;

  Set<String> get selectedSubjectIds => _selectedSubjectIds;
  Map<String, List<InfinitePracticeChapter>> get chaptersBySubject => _chaptersBySubject;
  Set<String> get selectedChapterIds => _selectedChapterIds;

  int get questionCount => _questionCount;
  bool get isEqualSplit => _isEqualSplit;
  Map<String, int> get customSubjectCounts => _customSubjectCounts;

  Set<int> get selectedDifficulties => _selectedDifficulties;
  Set<int> get selectedQuestionTypes => _selectedQuestionTypes;
  int get timeLimitPerQuestionSeconds => _timeLimitPerQuestionSeconds;

  PracticeProvider() {
    loadSubjects();
  }

  void selectBatch(BatchTrack batch) {
    if (_selectedBatch.id == batch.id) return;
    _selectedBatch = batch;
    _selectedSubjectIds.clear();
    _selectedChapterIds.clear();
    _chaptersBySubject.clear();
    _customSubjectCounts.clear();
    notifyListeners();
    loadSubjects();
  }

  Future<void> loadSubjects() async {
    _isLoadingSubjects = true;
    _subjectsError = null;
    notifyListeners();

    try {
      _subjects = await ApiService.fetchSubjects(_selectedBatch.id);
      // Auto-select the first subject by default
      if (_subjects.isNotEmpty) {
        toggleSubject(_subjects.first.subjectId);
      }
    } catch (e) {
      _subjectsError = e.toString();
    } finally {
      _isLoadingSubjects = false;
      notifyListeners();
    }
  }

  void toggleSubject(String subjectId) {
    if (_selectedSubjectIds.contains(subjectId)) {
      if (_selectedSubjectIds.length > 1) {
        _selectedSubjectIds.remove(subjectId);
        // Remove selected chapters belonging to this subject
        final chapters = _chaptersBySubject[subjectId] ?? [];
        for (final ch in chapters) {
          _selectedChapterIds.remove(ch.chapterId);
        }
        _customSubjectCounts.remove(subjectId);
      }
    } else {
      _selectedSubjectIds.add(subjectId);
      loadChaptersForSubject(subjectId);
    }
    _recalculateSubjectCounts();
    notifyListeners();
  }

  Future<void> loadChaptersForSubject(String subjectId) async {
    if (_chaptersBySubject.containsKey(subjectId)) return;
    _isLoadingChapters[subjectId] = true;
    notifyListeners();

    try {
      final chs = await ApiService.fetchChapters(_selectedBatch.id, subjectId);
      _chaptersBySubject[subjectId] = chs;
      // Auto-select all chapters for this subject initially
      for (final ch in chs) {
        _selectedChapterIds.add(ch.chapterId);
      }
    } catch (_) {} finally {
      _isLoadingChapters[subjectId] = false;
      notifyListeners();
    }
  }

  void toggleChapter(String chapterId) {
    if (_selectedChapterIds.contains(chapterId)) {
      _selectedChapterIds.remove(chapterId);
    } else {
      _selectedChapterIds.add(chapterId);
    }
    notifyListeners();
  }

  void selectAllChaptersForSubject(String subjectId) {
    final chs = _chaptersBySubject[subjectId] ?? [];
    for (final ch in chs) {
      _selectedChapterIds.add(ch.chapterId);
    }
    notifyListeners();
  }

  void clearAllChaptersForSubject(String subjectId) {
    final chs = _chaptersBySubject[subjectId] ?? [];
    for (final ch in chs) {
      _selectedChapterIds.remove(ch.chapterId);
    }
    notifyListeners();
  }

  void setQuestionCount(int count) {
    _questionCount = count.clamp(1, 100);
    _recalculateSubjectCounts();
    notifyListeners();
  }

  void setEqualSplit(bool equal) {
    _isEqualSplit = equal;
    _recalculateSubjectCounts();
    notifyListeners();
  }

  void updateSubjectCount(String subjectId, int count) {
    _customSubjectCounts[subjectId] = count.clamp(0, 100);
    notifyListeners();
  }

  void _recalculateSubjectCounts() {
    if (_selectedSubjectIds.isEmpty) return;
    if (_isEqualSplit) {
      final base = _questionCount ~/ _selectedSubjectIds.length;
      final rem = _questionCount % _selectedSubjectIds.length;
      int idx = 0;
      for (final sId in _selectedSubjectIds) {
        _customSubjectCounts[sId] = base + (idx < rem ? 1 : 0);
        idx++;
      }
    }
  }

  void toggleDifficulty(int level) {
    if (_selectedDifficulties.contains(level)) {
      if (_selectedDifficulties.length > 1) {
        _selectedDifficulties.remove(level);
      }
    } else {
      _selectedDifficulties.add(level);
    }
    notifyListeners();
  }

  void toggleQuestionType(int type) {
    if (_selectedQuestionTypes.contains(type)) {
      if (_selectedQuestionTypes.length > 1) {
        _selectedQuestionTypes.remove(type);
      }
    } else {
      _selectedQuestionTypes.add(type);
    }
    notifyListeners();
  }

  void setTimeLimitPreset(int seconds) {
    _timeLimitPerQuestionSeconds = seconds;
    notifyListeners();
  }
}
