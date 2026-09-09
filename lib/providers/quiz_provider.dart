import 'dart:async';
import 'package:flutter/material.dart';
import '../models/models.dart';

class QuizProvider extends ChangeNotifier {
  final List<InfinitePracticeQuestion> questions;
  final int timeLimitPerQuestionSeconds;
  final String _testId;

  int _currentIndex = 0;
  final Map<String, List<int>> _userAnswers = {}; // 1-based indices
  final Map<String, String> _userNumericalAnswers = {};
  final Set<String> _markedForReview = {};
  final Map<String, int> _timeSpentPerQuestion = {};

  Timer? _timer;
  int _currentQuestionSecondsLeft = 0;
  int _totalElapsedSeconds = 0;
  bool _isFinished = false;
  TestScoreReport? _result;

  int get currentIndex => _currentIndex;
  InfinitePracticeQuestion get currentQuestion =>
      questions.isNotEmpty ? questions[_currentIndex] : InfinitePracticeQuestion(questionId: '', content: '');
  int get totalQuestions => questions.length;
  bool get isFinished => _isFinished;
  TestScoreReport? get result => _result;

  int get currentQuestionSecondsLeft => _currentQuestionSecondsLeft;
  int get totalElapsedSeconds => _totalElapsedSeconds;

  QuizProvider({
    required this.questions,
    this.timeLimitPerQuestionSeconds = 0,
    String? testId,
  }) : _testId = testId ?? 'test-${DateTime.now().millisecondsSinceEpoch}' {
    if (questions.isNotEmpty) {
      _startTimer();
    }
  }

  void _startTimer() {
    if (questions.isEmpty) return;
    _currentQuestionSecondsLeft = timeLimitPerQuestionSeconds;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_isFinished || questions.isEmpty) {
        timer.cancel();
        return;
      }

      _totalElapsedSeconds++;
      if (_currentIndex < questions.length) {
        final qId = currentQuestion.questionId;
        _timeSpentPerQuestion[qId] = (_timeSpentPerQuestion[qId] ?? 0) + 1;
      }

      if (timeLimitPerQuestionSeconds > 0) {
        if (_currentQuestionSecondsLeft > 1) {
          _currentQuestionSecondsLeft--;
        } else {
          // Question time expired: auto-advance
          if (_currentIndex < questions.length - 1) {
            nextQuestion();
          } else {
            finishTest();
          }
        }
      }
      notifyListeners();
    });
  }

  void toggleOption(int optionIndex) {
    if (_isFinished || questions.isEmpty) return;
    final q = currentQuestion;
    final currentList = List<int>.from(_userAnswers[q.questionId] ?? []);

    if (q.type == 2) {
      // Multiple Choice
      if (currentList.contains(optionIndex)) {
        currentList.remove(optionIndex);
      } else {
        currentList.add(optionIndex);
      }
    } else {
      // Single Choice
      if (currentList.contains(optionIndex)) {
        currentList.clear();
      } else {
        currentList.clear();
        currentList.add(optionIndex);
      }
    }

    _userAnswers[q.questionId] = currentList;
    notifyListeners();
  }

  void setNumericalAnswer(String val) {
    if (_isFinished || questions.isEmpty) return;
    _userNumericalAnswers[currentQuestion.questionId] = val;
    notifyListeners();
  }

  void clearResponse() {
    if (_isFinished || questions.isEmpty) return;
    final qId = currentQuestion.questionId;
    _userAnswers.remove(qId);
    _userNumericalAnswers.remove(qId);
    notifyListeners();
  }

  void toggleMarkForReview() {
    if (_isFinished || questions.isEmpty) return;
    final qId = currentQuestion.questionId;
    if (_markedForReview.contains(qId)) {
      _markedForReview.remove(qId);
    } else {
      _markedForReview.add(qId);
    }
    notifyListeners();
  }

  bool isOptionSelected(int optionIndex) {
    if (questions.isEmpty) return false;
    return (_userAnswers[currentQuestion.questionId] ?? []).contains(optionIndex);
  }

  String getNumericalAnswer() {
    if (questions.isEmpty) return '';
    return _userNumericalAnswers[currentQuestion.questionId] ?? '';
  }

  bool isMarkedForReview(String questionId) {
    return _markedForReview.contains(questionId);
  }

  QuestionStatus getQuestionStatus(int index) {
    if (index >= questions.length) return QuestionStatus.notVisited;
    final q = questions[index];
    final hasAnswer = (_userAnswers[q.questionId]?.isNotEmpty ?? false) ||
        (_userNumericalAnswers[q.questionId]?.trim().isNotEmpty ?? false);
    final isMarked = _markedForReview.contains(q.questionId);

    if (hasAnswer && isMarked) return QuestionStatus.answeredAndMarked;
    if (isMarked) return QuestionStatus.markedForReview;
    if (hasAnswer) return QuestionStatus.answered;
    if (index <= _currentIndex) return QuestionStatus.skipped;
    return QuestionStatus.notVisited;
  }

  void jumpToQuestion(int index) {
    if (index >= 0 && index < questions.length) {
      _currentIndex = index;
      _currentQuestionSecondsLeft = timeLimitPerQuestionSeconds;
      notifyListeners();
    }
  }

  void nextQuestion() {
    if (_currentIndex < questions.length - 1) {
      _currentIndex++;
      _currentQuestionSecondsLeft = timeLimitPerQuestionSeconds;
      notifyListeners();
    }
  }

  void previousQuestion() {
    if (_currentIndex > 0) {
      _currentIndex--;
      _currentQuestionSecondsLeft = timeLimitPerQuestionSeconds;
      notifyListeners();
    }
  }

  void finishTest() {
    if (_isFinished) return;
    _isFinished = true;
    _timer?.cancel();

    int correct = 0;
    int incorrect = 0;
    int skipped = 0;
    final List<QuestionSolutionReview> reviews = [];

    for (final q in questions) {
      final userAns = _userAnswers[q.questionId] ?? [];
      final userNumText = _userNumericalAnswers[q.questionId]?.trim();
      final hasAnswer = userAns.isNotEmpty || (userNumText != null && userNumText.isNotEmpty);

      final correctIndices = <int>[];
      for (int i = 0; i < q.options.length; i++) {
        if (q.options[i].isCorrect) {
          correctIndices.add(i + 1);
        }
      }

      bool isAnswerCorrect = false;

      if (hasAnswer) {
        if (q.type == 3 && q.numericAnswer != null) {
          // Numerical comparison
          final userNum = double.tryParse(userNumText ?? '');
          final targetNum = double.tryParse(q.numericAnswer.toString().trim());
          if (userNum != null && targetNum != null) {
            isAnswerCorrect = (userNum - targetNum).abs() < 0.001;
          } else {
            isAnswerCorrect = (userNumText?.trim().toLowerCase() == q.numericAnswer.toString().trim().toLowerCase());
          }
        } else {
          // Option selection comparison
          if (correctIndices.isNotEmpty) {
            isAnswerCorrect = userAns.length == correctIndices.length &&
                userAns.every((idx) => correctIndices.contains(idx));
          }
        }

        if (isAnswerCorrect) {
          correct++;
        } else {
          incorrect++;
        }
      } else {
        skipped++;
      }

      reviews.add(QuestionSolutionReview(
        question: q,
        userSelectedIndices: userAns,
        userTextAnswer: userNumText,
        correctIndices: correctIndices,
        isCorrect: isAnswerCorrect,
        isAttempted: hasAnswer,
        timeSpentSeconds: _timeSpentPerQuestion[q.questionId] ?? 0,
      ));
    }

    final totalAttempted = correct + incorrect;
    final accuracy = totalAttempted > 0 ? ((correct / totalAttempted) * 100).round() : 0;
    final score = (correct * 4) - (incorrect * 1);

    _result = TestScoreReport(
      testId: _testId,
      totalQuestions: questions.length,
      attempted: totalAttempted,
      correct: correct,
      incorrect: incorrect,
      skipped: skipped,
      score: score,
      accuracy: accuracy,
      totalTimeSeconds: _totalElapsedSeconds,
      reviews: reviews,
    );

    notifyListeners();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
