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
    setState(() => _isSharing = true);
    try {
      final qList = widget.report.reviews.map((r) => r.question).toList();
      final code = await ApiService.shareTest(
        batchId: qList.first.chapterId.isNotEmpty ? qList.first.chapterId : 'practice',
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
    final report = widget.report;
    final mins = report.totalTimeSeconds ~/ 60;
    final secs = report.totalTimeSeconds % 60;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Performance Report', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.home_outlined),
            tooltip: 'Home',
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
          constraints: const BoxConstraints(maxWidth: 850),
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              // Scorecard Hero
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFEEF2FF), Colors.white, Color(0xFFF0FDF4)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFE0E7FF)),
                ),
                child: Column(
                  children: [
                    const Text(
                      'TOTAL PRACTICE SCORE',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF4F46E5), letterSpacing: 1.1),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${report.score}',
                      style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Accuracy: ${report.accuracy}%  •  Time: ${mins}m ${secs}s',
                      style: const TextStyle(fontSize: 13, color: Color(0xFF475569), fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 20),
                    // Stats Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _statCard('Attempted', '${report.attempted}/${report.totalQuestions}', const Color(0xFF64748B)),
                        _statCard('Correct', '${report.correct}', const Color(0xFF10B981)),
                        _statCard('Incorrect', '${report.incorrect}', const Color(0xFFEF4444)),
                        _statCard('Skipped', '${report.skipped}', const Color(0xFFF59E0B)),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: _isSharing
                          ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.share_outlined, size: 18),
                      label: Text(_shareCode != null ? 'Challenge Copied!' : 'Share Challenge'),
                      onPressed: _isSharing ? null : () => _shareChallenge(context),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton.icon(
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: const Text('New Practice Set'),
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

              const SizedBox(height: 32),

              // Detailed Solutions Header
              const Text(
                'Question-by-Question Review & Solutions',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 12),

              // Question Solutions List
              ...List.generate(report.reviews.length, (idx) {
                final rev = report.reviews[idx];
                final q = rev.question;

                Color statusBg;
                Color statusColor;
                String statusLabel;

                if (!rev.isAttempted) {
                  statusBg = const Color(0xFFFEF3C7);
                  statusColor = const Color(0xFFB45309);
                  statusLabel = 'Skipped';
                } else if (rev.isCorrect) {
                  statusBg = const Color(0xFFECFDF5);
                  statusColor = const Color(0xFF047857);
                  statusLabel = 'Correct (+4)';
                } else {
                  statusBg = const Color(0xFFFFF1F2);
                  statusColor = const Color(0xFFBE123C);
                  statusLabel = 'Incorrect (-1)';
                }

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  elevation: 0,
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Question header
                        Row(
                          children: [
                            Text(
                              'Q${idx + 1}',
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF0F172A)),
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
