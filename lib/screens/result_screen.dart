import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../widgets/math_formula_view.dart';
import 'home_screen.dart';

class ResultScreen extends StatefulWidget {
  final TestScoreReport report;

  const ResultScreen({super.key, required this.report});

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  bool _isSharing = false;
  String? _shareCode;

  Future<void> _shareChallenge(BuildContext context) async {
    if (widget.report.reviews.isEmpty) return;
    setState(() => _isSharing = true);
    try {
      final qList = widget.report.reviews.map((r) => r.question).toList();
      final code = await ApiService.shareTest(
        batchId: qList.isNotEmpty && qList.first.chapterId.isNotEmpty ? qList.first.chapterId : 'practice',
        batchName: 'Custom Practice',
        subjectNames: qList.map((q) => q.subjectName).toSet().toList(),
        timeLimitSeconds: widget.report.totalTimeSeconds,
        questions: qList,
      );

      if (mounted) {
        setState(() => _shareCode = code);
        if (code != null) {
          final shareUrl = 'https://mock.wegenz.in/?test=$code';
          await Clipboard.setData(ClipboardData(text: shareUrl));
          if (!context.mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Challenge link copied to clipboard: $shareUrl'),
              backgroundColor: const Color(0xFF4F46E5),
            ),
          );
        }
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isSharing = false);
    }
  }

  void _openVideoSolution(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.report;
    final minutes = (r.totalTimeSeconds ~/ 60).toString().padLeft(2, '0');
    final seconds = (r.totalTimeSeconds % 60).toString().padLeft(2, '0');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Practice Performance & Solutions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        actions: [
          TextButton.icon(
            icon: const Icon(Icons.home_outlined),
            label: const Text('Home'),
            onPressed: () {
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => const HomeScreen()),
                (route) => false,
              );
            },
          ),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 800),
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              // Summary Score Card
              Card(
                elevation: 0,
                color: const Color(0xFFEEF2FF),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: const BorderSide(color: Color(0xFFC7D2FE)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'TOTAL SCORE',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF4338CA),
                                  letterSpacing: 1.1,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.baseline,
                                textBaseline: TextBaseline.alphabetic,
                                children: [
                                  Text(
                                    '${r.score}',
                                    style: const TextStyle(
                                      fontSize: 42,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF1E1B4B),
                                    ),
                                  ),
                                  Text(
                                    ' / ${r.totalQuestions * 4}',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Container(
                            height: 72,
                            width: 72,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Color(0xFF4F46E5),
                            ),
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    '${r.accuracy}%',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 16,
                                    ),
                                  ),
                                  const Text(
                                    'Accuracy',
                                    style: TextStyle(
                                      color: Colors.white70,
                                      fontSize: 9,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      const Divider(color: Color(0xFFC7D2FE)),
                      const SizedBox(height: 16),
                      // Stats Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _statCard('Attempted', '${r.attempted}', const Color(0xFF4F46E5)),
                          _statCard('Correct', '${r.correct}', const Color(0xFF10B981)),
                          _statCard('Incorrect', '${r.incorrect}', const Color(0xFFE11D48)),
                          _statCard('Skipped', '${r.skipped}', const Color(0xFF64748B)),
                          _statCard('Time Spent', '$minutes:$seconds', const Color(0xFF0F172A)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // Action buttons: Share & Retake
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: const BorderSide(color: Color(0xFF4F46E5)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: _isSharing
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.share_rounded, size: 18),
                      label: Text(_shareCode != null ? 'Link Copied!' : 'Share Challenge Link'),
                      onPressed: _isSharing ? null : () => _shareChallenge(context),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: const Text('Start New Practice'),
                      onPressed: () {
                        Navigator.pushAndRemoveUntil(
                          context,
                          MaterialPageRoute(builder: (context) => const HomeScreen()),
                          (route) => false,
                        );
                      },
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 28),

              // Detailed Solutions Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'DETAILED STEP-BY-STEP REVIEW',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF4F46E5),
                      letterSpacing: 1.1,
                    ),
                  ),
                  Text(
                    '${r.reviews.length} Questions',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.bold),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Reviews List
              ...List.generate(r.reviews.length, (idx) {
                final rev = r.reviews[idx];
                final q = rev.question;

                Color statusColor;
                Color statusBg;
                String statusLabel;

                if (!rev.isAttempted) {
                  statusColor = const Color(0xFF64748B);
                  statusBg = const Color(0xFFF1F5F9);
                  statusLabel = 'Skipped (+0)';
                } else if (rev.isCorrect) {
                  statusColor = const Color(0xFF047857);
                  statusBg = const Color(0xFFECFDF5);
                  statusLabel = 'Correct (+4)';
                } else {
                  statusColor = const Color(0xFFBE123C);
                  statusBg = const Color(0xFFFFF1F2);
                  statusLabel = 'Incorrect (-1)';
                }

                return Card(
                  margin: const EdgeInsets.only(bottom: 20),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Card Header
                        Row(
                          children: [
                            Text(
                              'Question ${idx + 1}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            const SizedBox(width: 10),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(6)),
                              child: Text(
                                statusLabel,
                                style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ),
                            const Spacer(),
                            if (q.solutions.any((s) => s.videoUrl != null))
                              TextButton.icon(
                                style: TextButton.styleFrom(visualDensity: VisualDensity.compact),
                                icon: const Icon(Icons.play_circle_fill_rounded, size: 18, color: Color(0xFF4F46E5)),
                                label: const Text('Video Solution', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                onPressed: () {
                                  final vUrl = q.solutions.firstWhere((s) => s.videoUrl != null).videoUrl!;
                                  _openVideoSolution(vUrl);
                                },
                              ),
                          ],
                        ),

                        const SizedBox(height: 12),

                        // Question Content
                        MathFormulaView(
                          htmlContent: q.content,
                          textStyle: const TextStyle(fontSize: 15, height: 1.5, color: Color(0xFF1E293B)),
                        ),

                        const SizedBox(height: 14),

                        // Options Review
                        if (q.type != 3) ...[
                          ...List.generate(q.options.length, (optIdx) {
                            final optNumber = optIdx + 1;
                            final opt = q.options[optIdx];
                            final isUserSelected = rev.userSelectedIndices.contains(optNumber);
                            final isCorrectOpt = rev.correctIndices.contains(optNumber);

                            Color tileBg = Colors.transparent;
                            Color borderCol = const Color(0xFFE2E8F0);
                            Widget? trailingIcon;

                            if (isCorrectOpt) {
                              tileBg = const Color(0xFFECFDF5);
                              borderCol = const Color(0xFF10B981);
                              trailingIcon = const Icon(Icons.check_circle_rounded, color: Color(0xFF059669), size: 18);
                            } else if (isUserSelected && !isCorrectOpt) {
                              tileBg = const Color(0xFFFFF1F2);
                              borderCol = const Color(0xFFE11D48);
                              trailingIcon = const Icon(Icons.cancel_rounded, color: Color(0xFFE11D48), size: 18);
                            }

                            return Container(
                              margin: const EdgeInsets.only(bottom: 6),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: tileBg,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: borderCol),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${String.fromCharCode(65 + optIdx)}.',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: isCorrectOpt
                                          ? const Color(0xFF047857)
                                          : (isUserSelected ? const Color(0xFFBE123C) : const Color(0xFF64748B)),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: MathFormulaView(
                                      htmlContent: opt.text,
                                      textStyle: const TextStyle(fontSize: 14),
                                    ),
                                  ),
                                  ?trailingIcon,
                                ],
                              ),
                            );
                          }),
                        ],

                        // Numerical review
                        if (q.type == 3) ...[
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                Text('Your answer: ${rev.userTextAnswer ?? "None"}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                                const Spacer(),
                                Text('Correct answer: ${q.numericAnswer ?? "N/A"}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                              ],
                            ),
                          ),
                        ],

                        // Detailed written solution
                        if (q.solutions.isNotEmpty && q.solutions.first.text.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Explanation & Solution:',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF4F46E5)),
                                ),
                                const SizedBox(height: 6),
                                MathFormulaView(
                                  htmlContent: q.solutions.first.text,
                                  textStyle: const TextStyle(fontSize: 13.5, height: 1.5, color: Color(0xFF334155)),
                                ),
                                if (q.solutions.first.otherSolution != null) ...[
                                  const SizedBox(height: 8),
                                  MathFormulaView(
                                    htmlContent: q.solutions.first.otherSolution!,
                                    textStyle: const TextStyle(fontSize: 13.5, height: 1.5, color: Color(0xFF334155)),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  Widget _statCard(String label, String value, Color col) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: col)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
      ],
    );
  }
}
