class InfinitePracticeSubject {
  final String subjectId;
  final String englishName;
  final String? hindiName;
  final String? icon;
  final int chaptersCount;
  final int totalQuestions;

  InfinitePracticeSubject({
    required this.subjectId,
    required this.englishName,
    this.hindiName,
    this.icon,
    this.chaptersCount = 0,
    this.totalQuestions = 0,
  });

  factory InfinitePracticeSubject.fromJson(Map<String, dynamic> json) {
    return InfinitePracticeSubject(
      subjectId: json['subjectId']?.toString() ?? '',
      englishName: json['englishName']?.toString() ?? '',
      hindiName: json['hindiName']?.toString(),
      icon: json['icon']?.toString(),
      chaptersCount: (json['chaptersCount'] as num?)?.toInt() ?? 0,
      totalQuestions: (json['totalQuestions'] as num?)?.toInt() ?? 0,
    );
  }
}

class InfinitePracticeChapter {
  final String chapterId;
  final String englishName;
  final String? hindiName;
  final String subjectId;
  final String classId;
  final int questionCount;

  InfinitePracticeChapter({
    required this.chapterId,
    required this.englishName,
    this.hindiName,
    required this.subjectId,
    required this.classId,
    this.questionCount = 0,
  });

  factory InfinitePracticeChapter.fromJson(Map<String, dynamic> json) {
    int count = 0;
    final qc = json['questionCount'];
    if (qc is num) {
      count = qc.toInt();
    } else if (qc is String) {
      count = int.tryParse(qc) ?? 0;
    }

    return InfinitePracticeChapter(
      chapterId: json['chapterId']?.toString() ?? '',
      englishName: json['englishName']?.toString() ?? '',
      hindiName: json['hindiName']?.toString(),
      subjectId: json['subjectId']?.toString() ?? '',
      classId: json['classId']?.toString() ?? '',
      questionCount: count,
    );
  }
}

class InfinitePracticeOption {
  final String text;
  final String? imageUrl;
  final bool isCorrect;

  InfinitePracticeOption({
    required this.text,
    this.imageUrl,
    this.isCorrect = false,
  });

  factory InfinitePracticeOption.fromJson(Map<String, dynamic> json) {
    return InfinitePracticeOption(
      text: json['text']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString(),
      isCorrect: json['isCorrect'] == true,
    );
  }
}

class InfinitePracticeSolution {
  final String text;
  final String? otherSolution;
  final String? videoUrl;

  InfinitePracticeSolution({
    required this.text,
    this.otherSolution,
    this.videoUrl,
  });

  factory InfinitePracticeSolution.fromJson(Map<String, dynamic> json) {
    String? vUrl;
    if (json['videoSolution'] is Map) {
      vUrl = json['videoSolution']['url']?.toString();
    }

    return InfinitePracticeSolution(
      text: json['text']?.toString() ?? '',
      otherSolution: json['otherSolution']?.toString(),
      videoUrl: vUrl,
    );
  }
}

class InfinitePracticeQuestion {
  final String questionId;
  final String content;
  final String plainQuestionText;
  final int type; // 1: Single choice, 2: Multiple choice, 3: Numerical
  final String typeTitle;
  final int difficulty; // 1: Easy, 2: Medium, 3: Hard
  final List<InfinitePracticeOption> options;
  final List<InfinitePracticeSolution> solutions;
  final String chapterId;
  final String chapterName;
  final String subjectId;
  final String subjectName;
  final dynamic numericAnswer;

  InfinitePracticeQuestion({
    required this.questionId,
    required this.content,
    this.plainQuestionText = '',
    this.type = 1,
    this.typeTitle = 'Single Choice Question',
    this.difficulty = 1,
    this.options = const [],
    this.solutions = const [],
    this.chapterId = '',
    this.chapterName = '',
    this.subjectId = '',
    this.subjectName = '',
    this.numericAnswer,
  });

  factory InfinitePracticeQuestion.fromJson(Map<String, dynamic> json) {
    final opts = (json['options'] as List<dynamic>?)
            ?.map((o) {
              if (o is Map<String, dynamic>) {
                return InfinitePracticeOption.fromJson(o);
              }
              return InfinitePracticeOption(text: o?.toString() ?? '');
            })
            .toList() ??
        [];

    final sols = (json['solutions'] as List<dynamic>?)
            ?.map((s) {
              if (s is Map<String, dynamic>) {
                return InfinitePracticeSolution.fromJson(s);
              }
              return InfinitePracticeSolution(text: s?.toString() ?? '');
            })
            .toList() ??
        [];

    return InfinitePracticeQuestion(
      questionId: json['questionId']?.toString() ?? json['_id']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      plainQuestionText: json['plainQuestionText']?.toString() ?? '',
      type: (json['type'] as num?)?.toInt() ?? 1,
      typeTitle: json['typeTitle']?.toString() ?? 'Single Choice Question',
      difficulty: (json['difficulty'] as num?)?.toInt() ?? 1,
      options: opts,
      solutions: sols,
      chapterId: json['chapterId']?.toString() ?? '',
      chapterName: json['chapterName']?.toString() ?? '',
      subjectId: json['subjectId']?.toString() ?? '',
      subjectName: json['subjectName']?.toString() ?? '',
      numericAnswer: json['numericAnswer'] ?? (json['answers'] is List && (json['answers'] as List).isNotEmpty ? json['answers'][0] : null),
    );
  }
}

enum QuestionStatus { notVisited, skipped, answered, markedForReview, answeredAndMarked }

class UserAnswerRecord {
  final String questionId;
  final List<int> selectedOptionIndices; // 1-based indices (1, 2, 3, 4)
  final String? textAnswer; // For numerical questions
  final bool isMarkedForReview;
  final int timeSpentSeconds;

  UserAnswerRecord({
    required this.questionId,
    this.selectedOptionIndices = const [],
    this.textAnswer,
    this.isMarkedForReview = false,
    this.timeSpentSeconds = 0,
  });

  bool get isAttempted => selectedOptionIndices.isNotEmpty || (textAnswer != null && textAnswer!.trim().isNotEmpty);
}

class QuestionSolutionReview {
  final InfinitePracticeQuestion question;
  final List<int> userSelectedIndices;
  final String? userTextAnswer;
  final List<int> correctIndices;
  final bool isCorrect;
  final bool isAttempted;
  final int timeSpentSeconds;

  QuestionSolutionReview({
    required this.question,
    required this.userSelectedIndices,
    this.userTextAnswer,
    required this.correctIndices,
    required this.isCorrect,
    required this.isAttempted,
    this.timeSpentSeconds = 0,
  });
}

class TestScoreReport {
  final String testId;
  final int totalQuestions;
  final int attempted;
  final int correct;
  final int incorrect;
  final int skipped;
  final int score; // +4 for correct, -1 for incorrect
  final int accuracy; // Percentage
  final int totalTimeSeconds;
  final List<QuestionSolutionReview> reviews;

  TestScoreReport({
    required this.testId,
    required this.totalQuestions,
    required this.attempted,
    required this.correct,
    required this.incorrect,
    required this.skipped,
    required this.score,
    required this.accuracy,
    required this.totalTimeSeconds,
    required this.reviews,
  });
}
