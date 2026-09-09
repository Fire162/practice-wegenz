class AppConstants {
  static const String appName = 'Wegenz Practice';
  static const String apiBaseUrl = '/api'; // Uses relative /api on web; proxied to 8085

  // Precomputed AES-256 encrypted opaque tokens for subject icons
  static const Map<String, String> subjectIconTokens = {
    'chemistry': 'dd90024bb140a3c12a3be49e8d9b5d0a649553ad66cf7443ecd3721273bf8e285c3a3789c96942db7d3fdd73bf7c1f279b5a9ddd3655494db89c2bd01ddad044b7a16a47946c28b3f7e7e690178f06d04f23009e7b877ae2b32b0dd1b7f78940638c961a95616ad2c39ffa23c16b124f2f06a782274fde13e1dc86a3fde5f6e4',
    'physics': 'dd90024bb140a3c12a3be49e8d9b5d0a649553ad66cf7443ecd3721273bf8e285c3a3789c96942db7d3fdd73bf7c1f279b5a9ddd3655494db89c2bd01ddad044b7a16a47946c28b3f7e7e690178f06d00cbad100e48a1889624416397dec095290289ebebd8cffcaf631cb0bcdba445ede0984c188f97c42357186d5d001d8ea',
    'botany': 'dd90024bb140a3c12a3be49e8d9b5d0a649553ad66cf7443ecd3721273bf8e285c3a3789c96942db7d3fdd73bf7c1f279b5a9ddd3655494db89c2bd01ddad044b7a16a47946c28b3f7e7e690178f06d0bc55de4fe3b932fa3d23d5c5afd5a199b8af1632d76d4a7e0b5aa74330ea6e7f21a0696d0550802a7f077398a82a1d1e',
    'zoology': 'dd90024bb140a3c12a3be49e8d9b5d0a649553ad66cf7443ecd3721273bf8e285c3a3789c96942db7d3fdd73bf7c1f279b5a9ddd3655494db89c2bd01ddad044b7a16a47946c28b3f7e7e690178f06d0125b55ba942995b22345d6f8797facf79181600a08d0a17c6c634ebf41eb7012f04790a9aeb54fe0802cd9f9bbbf1523',
    'maths': 'dd90024bb140a3c12a3be49e8d9b5d0a649553ad66cf7443ecd3721273bf8e285c3a3789c96942db7d3fdd73bf7c1f279b5a9ddd3655494db89c2bd01ddad044b7a16a47946c28b3f7e7e690178f06d015a574cd523a6c647ab7ea74eeca31171b22687bf8c84d68554802a69003f2ec0807a9a2ef640ca20fa3106cb30ec547',
    'mathematics': 'dd90024bb140a3c12a3be49e8d9b5d0a649553ad66cf7443ecd3721273bf8e285c3a3789c96942db7d3fdd73bf7c1f279b5a9ddd3655494db89c2bd01ddad044b7a16a47946c28b3f7e7e690178f06d015a574cd523a6c647ab7ea74eeca31171b22687bf8c84d68554802a69003f2ec0807a9a2ef640ca20fa3106cb30ec547',
    'biology': 'dd90024bb140a3c12a3be49e8d9b5d0a649553ad66cf7443ecd3721273bf8e285c3a3789c96942db7d3fdd73bf7c1f279b5a9ddd3655494db89c2bd01ddad044b7a16a47946c28b3f7e7e690178f06d0bc55de4fe3b932fa3d23d5c5afd5a199b8af1632d76d4a7e0b5aa74330ea6e7f21a0696d0550802a7f077398a82a1d1e',
  };

  static String? getSubjectIconToken(String subjectName) {
    final lower = subjectName.toLowerCase().trim();
    for (final entry in subjectIconTokens.entries) {
      if (lower.contains(entry.key)) {
        return entry.value;
      }
    }
    return null;
  }
}

class BatchTrack {
  final String id;
  final String name;
  final String detail;
  final bool isJee;

  const BatchTrack({
    required this.id,
    required this.name,
    required this.detail,
    required this.isJee,
  });
}

const List<BatchTrack> kBatches = [
  BatchTrack(
    id: '11th_JEE',
    name: '11th JEE',
    detail: 'Physics, Chemistry, Mathematics (Class 11)',
    isJee: true,
  ),
  BatchTrack(
    id: '12th_JEE',
    name: '12th JEE',
    detail: 'Physics, Chemistry, Mathematics (Class 12)',
    isJee: true,
  ),
  BatchTrack(
    id: '11th_NEET',
    name: '11th NEET',
    detail: 'Botany, Chemistry, Physics, Zoology (Class 11)',
    isJee: false,
  ),
  BatchTrack(
    id: '12th_NEET',
    name: '12th NEET',
    detail: 'Botany, Chemistry, Physics, Zoology (Class 12)',
    isJee: false,
  ),
];
