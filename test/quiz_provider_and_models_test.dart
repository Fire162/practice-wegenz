import 'package:flutter_test/flutter_test.dart';
import 'package:practice_wegenz/models/models.dart';
import 'package:practice_wegenz/providers/quiz_provider.dart';

void main() {
  group('Models JSON Deserialization', () {
    test('Subject deserialization', () {
      final json = {
        'subjectId': 'physics_11',
        'englishName': 'Physics',
        'hindiName': 'भौतिक विज्ञान',
        'icon': 'token123',
        'chaptersCount': 15,
        'totalQuestions': 12000,
      };
      final subject = InfinitePracticeSubject.fromJson(json);
      expect(subject.subjectId, 'physics_11');
      expect(subject.englishName, 'Physics');
      expect(subject.chaptersCount, 15);
      expect(subject.totalQuestions, 12000);
    });

    test('Chapter deserialization with string question count', () {
      final json = {
        'chapterId': 'kinematics',
        'englishName': 'Kinematics',
        'subjectId': 'physics_11',
        'classId': '11',
        'questionCount': '450',
      };
      final chapter = InfinitePracticeChapter.fromJson(json);
      expect(chapter.chapterId, 'kinematics');
      expect(chapter.questionCount, 450);
    });

    test('Single choice question deserialization', () {
      final json = {
        '_id': 'q101',
        'content': 'What is the SI unit of Force?',
        'plainQuestionText': 'What is the SI unit of Force?',
        'type': 1,
        'typeTitle': 'Single Choice Question',
        'difficulty': 1,
        'options': [
          {'text': 'Joule', 'isCorrect': false},
          {'text': 'Newton', 'isCorrect': true},
          {'text': 'Pascal', 'isCorrect': false},
          {'text': 'Watt', 'isCorrect': false},
        ],
        'solutions': [
          {
            'text': 'Newton is the SI unit of force.',
            'videoSolution': {'url': 'https://example.com/video.mp4'}
          }
        ],
        'chapterId': 'nlom',
        'chapterName': 'Newton Laws of Motion',
        'subjectId': 'physics_11',
        'subjectName': 'Physics',
      };
      final q = InfinitePracticeQuestion.fromJson(json);
      expect(q.questionId, 'q101');
      expect(q.type, 1);
      expect(q.options.length, 4);
      expect(q.options[1].isCorrect, true);
      expect(q.solutions.first.videoUrl, 'https://example.com/video.mp4');
    });

    test('Numerical question deserialization', () {
      final json = {
        '_id': 'q102',
        'content': 'Find the acceleration due to gravity in m/s^2',
        'type': 3,
        'typeTitle': 'Numerical Question',
        'numericAnswer': 9.8,
        'options': [],
        'solutions': [],
      };
      final q = InfinitePracticeQuestion.fromJson(json);
      expect(q.questionId, 'q102');
      expect(q.type, 3);
      expect(q.numericAnswer, 9.8);
    });

    test('Question deserialization handles raw string options and solutions without crashing', () {
      final json = {
        'questionId': 'q_string_robust',
        'content': 'Sample question',
        'options': ['Raw Option 1', 'Raw Option 2'],
        'solutions': ['Raw solution string'],
      };
      final q = InfinitePracticeQuestion.fromJson(json);
      expect(q.options.length, 2);
      expect(q.options[0].text, 'Raw Option 1');
      expect(q.solutions.length, 1);
      expect(q.solutions[0].text, 'Raw solution string');
    });
  });

  group('QuizProvider Scoring & Navigation Logic', () {
    late InfinitePracticeQuestion qSingle;
    late InfinitePracticeQuestion qMulti;
    late InfinitePracticeQuestion qNumeric;

    setUp(() {
      qSingle = InfinitePracticeQuestion(
        questionId: 'q1',
        content: 'Q1 Single choice',
        type: 1,
        options: [
          InfinitePracticeOption(text: 'A', isCorrect: false),
          InfinitePracticeOption(text: 'B', isCorrect: true),
          InfinitePracticeOption(text: 'C', isCorrect: false),
        ],
      );

      qMulti = InfinitePracticeQuestion(
        questionId: 'q2',
        content: 'Q2 Multi choice',
        type: 2,
        options: [
          InfinitePracticeOption(text: 'A', isCorrect: true),
          InfinitePracticeOption(text: 'B', isCorrect: false),
          InfinitePracticeOption(text: 'C', isCorrect: true),
        ],
      );

      qNumeric = InfinitePracticeQuestion(
        questionId: 'q3',
        content: 'Q3 Numerical',
        type: 3,
        numericAnswer: 12.5,
      );
    });

    test('All correct answers gives perfect score (+12) and 100% accuracy', () {
      final quiz = QuizProvider(
        questions: [qSingle, qMulti, qNumeric],
        testId: 'test-perfect',
      );

      // Answer Q1: option 2 (1-based index)
      quiz.toggleOption(2);

      // Jump to Q2 and answer options 1 and 3
      quiz.jumpToQuestion(1);
      quiz.toggleOption(1);
      quiz.toggleOption(3);

      // Jump to Q3 and answer numerical 12.500
      quiz.jumpToQuestion(2);
      quiz.setNumericalAnswer('12.500');

      quiz.finishTest();
      final report = quiz.result;

      expect(report, isNotNull);
      expect(report!.totalQuestions, 3);
      expect(report.attempted, 3);
      expect(report.correct, 3);
      expect(report.incorrect, 0);
      expect(report.skipped, 0);
      expect(report.score, 12); // 3 * +4
      expect(report.accuracy, 100);
      quiz.dispose();
    });

    test('Incorrect answers apply negative marking (-1) and skipped apply 0', () {
      final quiz = QuizProvider(
        questions: [qSingle, qMulti, qNumeric],
        testId: 'test-mixed',
      );

      // Answer Q1 correctly (+4)
      quiz.toggleOption(2);

      // Answer Q2 incorrectly (-1) by selecting only option 1
      quiz.jumpToQuestion(1);
      quiz.toggleOption(1);

      // Skip Q3 (do not answer)

      quiz.finishTest();
      final report = quiz.result;

      expect(report, isNotNull);
      expect(report!.totalQuestions, 3);
      expect(report.attempted, 2);
      expect(report.correct, 1);
      expect(report.incorrect, 1);
      expect(report.skipped, 1);
      expect(report.score, 3); // (1 * 4) - (1 * 1) = 3
      expect(report.accuracy, 50); // 1 correct out of 2 attempted
      quiz.dispose();
    });

    test('Question status transitions and review flags', () {
      final quiz = QuizProvider(
        questions: [qSingle, qMulti],
        testId: 'test-status',
      );

      // Initial status
      expect(quiz.getQuestionStatus(0), QuestionStatus.skipped); // Current question before answer
      expect(quiz.getQuestionStatus(1), QuestionStatus.notVisited);

      // Mark for review
      quiz.toggleMarkForReview();
      expect(quiz.getQuestionStatus(0), QuestionStatus.markedForReview);

      // Answer it
      quiz.toggleOption(2);
      expect(quiz.getQuestionStatus(0), QuestionStatus.answeredAndMarked);

      // Unmark review
      quiz.toggleMarkForReview();
      expect(quiz.getQuestionStatus(0), QuestionStatus.answered);

      // Navigation
      quiz.nextQuestion();
      expect(quiz.currentIndex, 1);
      quiz.previousQuestion();
      expect(quiz.currentIndex, 0);
      quiz.dispose();
    });

    test('Clear response resets option selection and numerical text answers', () {
      final quiz = QuizProvider(
        questions: [qSingle, qNumeric],
        testId: 'test-clear',
      );

      // Select option on Q1
      quiz.toggleOption(2);
      expect(quiz.isOptionSelected(2), true);
      expect(quiz.getQuestionStatus(0), QuestionStatus.answered);

      // Clear response
      quiz.clearResponse();
      expect(quiz.isOptionSelected(2), false);
      expect(quiz.getQuestionStatus(0), QuestionStatus.skipped);

      // Set numerical answer on Q2
      quiz.jumpToQuestion(1);
      quiz.setNumericalAnswer('42.0');
      expect(quiz.getNumericalAnswer(), '42.0');
      expect(quiz.getQuestionStatus(1), QuestionStatus.answered);

      // Clear response
      quiz.clearResponse();
      expect(quiz.getNumericalAnswer(), '');
      expect(quiz.getQuestionStatus(1), QuestionStatus.skipped);

      quiz.dispose();
    });

    test('Numerical floating point tolerance handles precision within 0.001', () {
      // Test within tolerance: 12.5008 - 12.5 = 0.0008 (< 0.001) -> correct
      final quizPass = QuizProvider(
        questions: [qNumeric],
        testId: 'test-num-pass',
      );
      quizPass.setNumericalAnswer(' 12.5008 ');
      quizPass.finishTest();
      expect(quizPass.result!.correct, 1);
      expect(quizPass.result!.score, 4);
      quizPass.dispose();

      // Test outside tolerance: 12.502 - 12.5 = 0.002 (>= 0.001) -> incorrect
      final quizFail = QuizProvider(
        questions: [qNumeric],
        testId: 'test-num-fail',
      );
      quizFail.setNumericalAnswer('12.502');
      quizFail.finishTest();
      expect(quizFail.result!.incorrect, 1);
      expect(quizFail.result!.score, -1);
      quizFail.dispose();
    });

    test('Resilient instantiation with empty question list does not crash', () {
      final emptyQuiz = QuizProvider(
        questions: [],
        testId: 'test-empty',
      );

      expect(emptyQuiz.totalQuestions, 0);
      expect(emptyQuiz.isFinished, false);
      expect(emptyQuiz.isOptionSelected(1), false);
      expect(emptyQuiz.getNumericalAnswer(), '');
      expect(emptyQuiz.getQuestionStatus(0), QuestionStatus.notVisited);

      // Finish empty test
      emptyQuiz.finishTest();
      expect(emptyQuiz.isFinished, true);
      expect(emptyQuiz.result, isNotNull);
      expect(emptyQuiz.result!.totalQuestions, 0);
      expect(emptyQuiz.result!.score, 0);
      expect(emptyQuiz.result!.accuracy, 0);
      emptyQuiz.dispose();
    });
  });
}
