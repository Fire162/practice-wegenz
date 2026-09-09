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
  });
}
