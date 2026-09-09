import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/constants.dart';
import '../models/models.dart';
import '../providers/practice_provider.dart';
import '../providers/quiz_provider.dart';
import '../services/api_service.dart';
import 'test_room_screen.dart';

class PracticeSetupScreen extends StatefulWidget {
  const PracticeSetupScreen({super.key});

  @override
  State<PracticeSetupScreen> createState() => _PracticeSetupScreenState();
}

class _PracticeSetupScreenState extends State<PracticeSetupScreen> {
  bool _isGeneratingTest = false;
  String? _generateError;
  final TextEditingController _chapterSearchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _chapterSearchController.dispose();
    super.dispose();
  }

  Future<void> _startTest(PracticeProvider provider) async {
    if (provider.selectedSubjectIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one subject.')),
      );
      return;
    }

    if (provider.selectedChapterIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one chapter.')),
      );
      return;
    }

    setState(() {
      _isGeneratingTest = true;
      _generateError = null;
    });

    try {
      final subjects = provider.subjects
          .where((s) => provider.selectedSubjectIds.contains(s.subjectId))
          .map((s) => s.englishName)
          .toList();

      final List<String> chapters = [];
      for (final sId in provider.selectedSubjectIds) {
        final chs = provider.chaptersBySubject[sId] ?? [];
        for (final ch in chs) {
          if (provider.selectedChapterIds.contains(ch.chapterId)) {
            chapters.add(ch.englishName);
          }
        }
      }

      final Map<String, int> allocations = {};
      if (!provider.isEqualSplit) {
        for (final s in provider.subjects) {
          if (provider.selectedSubjectIds.contains(s.subjectId)) {
            allocations[s.englishName] = provider.customSubjectCounts[s.subjectId] ?? 0;
          }
        }
      }

      final questions = await ApiService.fetchPracticeQuestions(
        batchId: provider.selectedBatch.id,
        subjects: subjects,
        chapters: chapters,
        count: provider.questionCount,
        types: provider.selectedQuestionTypes.toList(),
        difficulty: provider.selectedDifficulties.toList(),
        subjectAllocations: allocations.isNotEmpty ? allocations : null,
      );

      if (!mounted) return;

      if (questions.isEmpty) {
        throw Exception('No questions returned for this selection. Try selecting more chapters.');
      }

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => ChangeNotifierProvider(
            create: (_) => QuizProvider(
              questions: questions,
              timeLimitPerQuestionSeconds: provider.timeLimitPerQuestionSeconds,
            ),
            child: const TestRoomScreen(),
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _generateError = e.toString().replaceAll('Exception:', '').trim();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isGeneratingTest = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PracticeProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          '${provider.selectedBatch.name} Practice Setup',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: provider.isLoadingSubjects
          ? const Center(child: CircularProgressIndicator())
          : Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1000),
                child: ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    if (_generateError != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 20),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF1F2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFECDD3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, color: Color(0xFFE11D48)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(_generateError!, style: const TextStyle(color: Color(0xFFBE123C), fontSize: 13)),
                            ),
                          ],
                        ),
                      ),

                    // Step 1: Subjects
                    _buildSectionHeader('STEP 1: SELECT SUBJECTS', 'Choose which subjects to include'),
                    const SizedBox(height: 12),
                    _buildSubjectSelector(provider),

                    const SizedBox(height: 28),

                    // Step 2: Chapters
                    _buildSectionHeader('STEP 2: SELECT CHAPTERS', 'Filter chapters for chosen subjects'),
                    const SizedBox(height: 12),
                    _buildChapterSection(provider),

                    const SizedBox(height: 28),

                    // Step 3: Question Count
                    _buildSectionHeader('STEP 3: QUESTION COUNT', 'How many questions do you want to practice?'),
                    const SizedBox(height: 12),
                    _buildQuestionCountSection(provider),

                    const SizedBox(height: 28),

                    // Step 4: Time Limit & Filters
                    _buildSectionHeader('STEP 4: TIME LIMIT & FILTERS', 'Configure pace and question types'),
                    const SizedBox(height: 12),
                    _buildTimerAndFiltersSection(provider),

                    const SizedBox(height: 40),

                    // Start Test Button
                    SizedBox(
                      height: 52,
                      child: FilledButton(
                        onPressed: _isGeneratingTest ? null : () => _startTest(provider),
                        child: _isGeneratingTest
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.play_arrow_rounded, size: 22),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Start Practice Test (${provider.questionCount} Questions)',
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSectionHeader(String subtitle, String title) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          subtitle,
          style: const TextStyle(color: Color(0xFF4F46E5), fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.1),
        ),
        const SizedBox(height: 2),
        Text(
          title,
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
      ],
    );
  }

  Widget _buildSubjectSelector(PracticeProvider provider) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: provider.subjects.map((subject) {
        final isSelected = provider.selectedSubjectIds.contains(subject.subjectId);
        final token = AppConstants.getSubjectIconToken(subject.englishName);

        return FilterChip(
          selected: isSelected,
          showCheckmark: false,
          avatar: token != null
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: Image.network(
                    ApiService.resolveImageUrl(token),
                    height: 20,
                    width: 20,
                    fit: BoxFit.contain,
                  ),
                )
              : const Icon(Icons.menu_book, size: 18),
          label: Text(
            '${subject.englishName} (${subject.chaptersCount} Ch)',
            style: TextStyle(
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: isSelected ? const Color(0xFF4F46E5) : const Color(0xFF334155),
            ),
          ),
          backgroundColor: Colors.white,
          selectedColor: const Color(0xFFEEF2FF),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: isSelected ? const Color(0xFF6366F1) : const Color(0xFFCBD5E1), width: isSelected ? 1.5 : 1),
          ),
          onSelected: (_) => provider.toggleSubject(subject.subjectId),
        );
      }).toList(),
    );
  }

  Widget _buildChapterSection(PracticeProvider provider) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _chapterSearchController,
              decoration: InputDecoration(
                hintText: 'Search chapters by name...',
                prefixIcon: const Icon(Icons.search, size: 20, color: Color(0xFF64748B)),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
              ),
              onChanged: (val) {
                setState(() {
                  _searchQuery = val.trim().toLowerCase();
                });
              },
            ),
            const SizedBox(height: 16),
            ...provider.selectedSubjectIds.map((sId) {
              final subject = provider.subjects.firstWhere((s) => s.subjectId == sId, orElse: () => InfinitePracticeSubject(subjectId: sId, englishName: sId));
              final allChapters = provider.chaptersBySubject[sId] ?? [];
              final filteredChapters = _searchQuery.isEmpty
                  ? allChapters
                  : allChapters.where((c) => c.englishName.toLowerCase().contains(_searchQuery)).toList();

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ExpansionTile(
                  initiallyExpanded: true,
                  title: Text(
                    '${subject.englishName} (${filteredChapters.length} Chapters)',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextButton(
                        onPressed: () => provider.selectAllChaptersForSubject(sId),
                        child: const Text('Select All', style: TextStyle(fontSize: 12)),
                      ),
                      TextButton(
                        onPressed: () => provider.clearAllChaptersForSubject(sId),
                        child: const Text('Clear', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      ),
                    ],
                  ),
                  children: [
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 250),
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: filteredChapters.length,
                        itemBuilder: (context, idx) {
                          final ch = filteredChapters[idx];
                          final isChecked = provider.selectedChapterIds.contains(ch.chapterId);

                          return CheckboxListTile(
                            dense: true,
                            title: Text(ch.englishName, style: const TextStyle(fontSize: 13)),
                            subtitle: Text('${ch.questionCount} Questions', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                            value: isChecked,
                            activeColor: const Color(0xFF4F46E5),
                            onChanged: (_) => provider.toggleChapter(ch.chapterId),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestionCountSection(PracticeProvider provider) {
    const presets = [5, 10, 15, 20, 25, 30, 45, 60, 75, 100];

    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: presets.map((count) {
                final isSelected = provider.questionCount == count;
                return ChoiceChip(
                  label: Text('$count Qs'),
                  selected: isSelected,
                  selectedColor: const Color(0xFF4F46E5),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : const Color(0xFF334155),
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                  onSelected: (_) => provider.setQuestionCount(count),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Text('Custom Count:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                Expanded(
                  child: Slider(
                    value: provider.questionCount.toDouble(),
                    min: 1,
                    max: 100,
                    divisions: 99,
                    activeColor: const Color(0xFF4F46E5),
                    onChanged: (val) => provider.setQuestionCount(val.round()),
                  ),
                ),
                Text(
                  '${provider.questionCount} Qs',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF4F46E5)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimerAndFiltersSection(PracticeProvider provider) {
    final timerPresets = [
      {'label': 'No Limit', 'seconds': 0},
      {'label': '1 min / Q', 'seconds': 60},
      {'label': '2 min / Q', 'seconds': 120},
      {'label': '3 min / Q', 'seconds': 180},
    ];

    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Time Boundation:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: timerPresets.map((preset) {
                final isSelected = provider.timeLimitPerQuestionSeconds == preset['seconds'];
                return ChoiceChip(
                  label: Text(preset['label'] as String),
                  selected: isSelected,
                  selectedColor: const Color(0xFF4F46E5),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : const Color(0xFF334155),
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                  onSelected: (_) => provider.setTimeLimitPreset(preset['seconds'] as int),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            const Text('Difficulty Levels:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                {'name': 'Easy', 'val': 1},
                {'name': 'Medium', 'val': 2},
                {'name': 'Hard', 'val': 3},
              ].map((diff) {
                final isSelected = provider.selectedDifficulties.contains(diff['val']);
                return FilterChip(
                  label: Text(diff['name'] as String),
                  selected: isSelected,
                  selectedColor: const Color(0xFFEEF2FF),
                  onSelected: (_) => provider.toggleDifficulty(diff['val'] as int),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}
