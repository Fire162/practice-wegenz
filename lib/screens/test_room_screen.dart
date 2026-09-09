import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/models.dart';
import '../providers/quiz_provider.dart';
import '../widgets/math_formula_view.dart';
import 'result_screen.dart';

class TestRoomScreen extends StatelessWidget {
  const TestRoomScreen({super.key});

  void _confirmSubmit(BuildContext context, QuizProvider quiz) {
    int answered = 0;
    for (int i = 0; i < quiz.totalQuestions; i++) {
      final s = quiz.getQuestionStatus(i);
      if (s == QuestionStatus.answered || s == QuestionStatus.answeredAndMarked) {
        answered++;
      }
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Submit Practice Test?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('You have answered $answered out of ${quiz.totalQuestions} questions.'),
            const SizedBox(height: 8),
            Text(
              'Unanswered questions will be marked as skipped. Are you sure you want to finish?',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Continue Test'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              quiz.finishTest();
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (context) => ResultScreen(report: quiz.result!),
                ),
              );
            },
            child: const Text('Submit Test'),
          ),
        ],
      ),
    );
  }

  void _openPaletteSheet(BuildContext context, QuizProvider quiz) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.85,
        expand: false,
        builder: (context, scrollController) => Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Question Palette',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Legend
              Wrap(
                spacing: 12,
                runSpacing: 6,
                children: [
                  _legendItem(const Color(0xFF10B981), 'Answered'),
                  _legendItem(const Color(0xFFF59E0B), 'Review'),
                  _legendItem(const Color(0xFF8B5CF6), 'Ans & Review'),
                  _legendItem(const Color(0xFFE2E8F0), 'Skipped / Unvisited'),
                ],
              ),
              const Divider(height: 24),
              Expanded(
                child: GridView.builder(
                  controller: scrollController,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 6,
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                  ),
                  itemCount: quiz.totalQuestions,
                  itemBuilder: (context, index) {
                    final status = quiz.getQuestionStatus(index);
                    final isCurrent = quiz.currentIndex == index;

                    Color bg;
                    Color textCol = Colors.white;

                    switch (status) {
                      case QuestionStatus.answered:
                        bg = const Color(0xFF10B981);
                        break;
                      case QuestionStatus.markedForReview:
                        bg = const Color(0xFFF59E0B);
                        break;
                      case QuestionStatus.answeredAndMarked:
                        bg = const Color(0xFF8B5CF6);
                        break;
                      case QuestionStatus.skipped:
                        bg = const Color(0xFFE2E8F0);
                        textCol = const Color(0xFF475569);
                        break;
                      default:
                        bg = const Color(0xFFF8FAFC);
                        textCol = const Color(0xFF64748B);
                        break;
                    }

                    return InkWell(
                      borderRadius: BorderRadius.circular(10),
                      onTap: () {
                        quiz.jumpToQuestion(index);
                        Navigator.pop(ctx);
                      },
                      child: Container(
                        decoration: BoxDecoration(
                          color: bg,
                          borderRadius: BorderRadius.circular(10),
                          border: isCurrent
                              ? Border.all(color: const Color(0xFF4F46E5), width: 2.5)
                              : Border.all(color: const Color(0xFFCBD5E1), width: 1),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '${index + 1}',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: textCol),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _legendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3)),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF475569))),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final quiz = context.watch<QuizProvider>();
    final q = quiz.currentQuestion;

    String timerText = '';
    if (quiz.timeLimitPerQuestionSeconds > 0) {
      final s = quiz.currentQuestionSecondsLeft;
      final mins = (s ~/ 60).toString().padLeft(2, '0');
      final secs = (s % 60).toString().padLeft(2, '0');
      timerText = '$mins:$secs';
    } else {
      final s = quiz.totalElapsedSeconds;
      final mins = (s ~/ 60).toString().padLeft(2, '0');
      final secs = (s % 60).toString().padLeft(2, '0');
      timerText = '$mins:$secs';
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Question ${quiz.currentIndex + 1} of ${quiz.totalQuestions}',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Text(
              q.chapterName.isNotEmpty ? q.chapterName : q.subjectName,
              style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
        actions: [
          // Timer badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              color: (quiz.timeLimitPerQuestionSeconds > 0 && quiz.currentQuestionSecondsLeft <= 15)
                  ? const Color(0xFFFFF1F2)
                  : const Color(0xFFEEF2FF),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: (quiz.timeLimitPerQuestionSeconds > 0 && quiz.currentQuestionSecondsLeft <= 15)
                    ? const Color(0xFFFECDD3)
                    : const Color(0xFFC7D2FE),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.timer_outlined,
                  size: 15,
                  color: (quiz.timeLimitPerQuestionSeconds > 0 && quiz.currentQuestionSecondsLeft <= 15)
                      ? const Color(0xFFE11D48)
                      : const Color(0xFF4F46E5),
                ),
                const SizedBox(width: 4),
                Text(
                  timerText,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: (quiz.timeLimitPerQuestionSeconds > 0 && quiz.currentQuestionSecondsLeft <= 15)
                        ? const Color(0xFFE11D48)
                        : const Color(0xFF4F46E5),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.grid_view_rounded),
            tooltip: 'Question Palette',
            onPressed: () => _openPaletteSheet(context, quiz),
          ),
          FilledButton.tonal(
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              visualDensity: VisualDensity.compact,
            ),
            onPressed: () => _confirmSubmit(context, quiz),
            child: const Text('Submit', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 10),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 850),
          child: Column(
            children: [
              // Question & Options scrollable area
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    // Badges row
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEEF2FF),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            q.subjectName.isNotEmpty ? q.subjectName : 'Question',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF4F46E5)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            q.typeTitle,
                            style: const TextStyle(fontSize: 11, color: Color(0xFF475569)),
                          ),
                        ),
                        const Spacer(),
                        if (quiz.isMarkedForReview(q.questionId))
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              '★ Marked for Review',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFD97706)),
                            ),
                          ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Question Content
                    Card(
                      elevation: 0,
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: MathFormulaView(
                          htmlContent: q.content,
                          textStyle: const TextStyle(fontSize: 16, height: 1.5, color: Color(0xFF0F172A)),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Options List / Numerical Keypad
                    if (q.type == 3) ...[
                      Card(
                        elevation: 0,
                        child: Padding(
                          padding: const EdgeInsets.all(18),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Enter Numerical Answer:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              const SizedBox(height: 10),
                              TextField(
                                keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                                decoration: const InputDecoration(
                                  hintText: 'Type decimal or integer answer...',
                                  border: OutlineInputBorder(),
                                ),
                                onChanged: (val) => quiz.setNumericalAnswer(val),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ] else ...[
                      ...List.generate(q.options.length, (idx) {
                        final opt = q.options[idx];
                        final optIndex = idx + 1;
                        final isSelected = quiz.isOptionSelected(optIndex);

                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFFEEF2FF) : Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isSelected ? const Color(0xFF6366F1) : const Color(0xFFE2E8F0),
                              width: isSelected ? 1.5 : 1,
                            ),
                          ),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(14),
                            onTap: () => quiz.toggleOption(optIndex),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    height: 24,
                                    width: 24,
                                    margin: const EdgeInsets.only(top: 2),
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: isSelected ? const Color(0xFF4F46E5) : Colors.transparent,
                                      border: Border.all(
                                        color: isSelected ? const Color(0xFF4F46E5) : const Color(0xFF94A3B8),
                                        width: 1.5,
                                      ),
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      String.fromCharCode(65 + idx),
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: isSelected ? Colors.white : const Color(0xFF64748B),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: MathFormulaView(
                                      htmlContent: opt.text,
                                      textStyle: TextStyle(
                                        fontSize: 15,
                                        color: isSelected ? const Color(0xFF1E1B4B) : const Color(0xFF1E293B),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }),
                    ],
                  ],
                ),
              ),

              // Bottom Navigation Bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: Colors.grey.shade200)),
                ),
                child: Row(
                  children: [
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      onPressed: () => quiz.clearResponse(),
                      child: const Text('Clear', style: TextStyle(fontSize: 12)),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      onPressed: () => quiz.toggleMarkForReview(),
                      icon: Icon(
                        quiz.isMarkedForReview(q.questionId) ? Icons.bookmark : Icons.bookmark_border,
                        size: 16,
                      ),
                      label: Text(
                        quiz.isMarkedForReview(q.questionId) ? 'Unmark' : 'Review',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                    const Spacer(),
                    if (quiz.currentIndex > 0)
                      IconButton(
                        icon: const Icon(Icons.arrow_back_rounded),
                        onPressed: () => quiz.previousQuestion(),
                      ),
                    const SizedBox(width: 6),
                    FilledButton(
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                      ),
                      onPressed: () {
                        if (quiz.currentIndex < quiz.totalQuestions - 1) {
                          quiz.nextQuestion();
                        } else {
                          _confirmSubmit(context, quiz);
                        }
                      },
                      child: Text(
                        quiz.currentIndex < quiz.totalQuestions - 1 ? 'Next' : 'Finish',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
