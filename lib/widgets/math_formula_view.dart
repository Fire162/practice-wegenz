import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import '../services/api_service.dart';

class MathFormulaView extends StatelessWidget {
  final String htmlContent;
  final TextStyle? textStyle;
  final TextAlign textAlign;

  const MathFormulaView({
    super.key,
    required this.htmlContent,
    this.textStyle,
    this.textAlign = TextAlign.start,
  });

  @override
  Widget build(BuildContext context) {
    if (htmlContent.isEmpty) return const SizedBox.shrink();

    final blocks = _parseBlocks(htmlContent);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: blocks.map((block) => _buildBlock(context, block)).toList(),
    );
  }

  Widget _buildBlock(BuildContext context, _ContentBlock block) {
    if (block.isImage) {
      final imgUrl = ApiService.resolveImageUrl(block.text);
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.network(
            imgUrl,
            fit: BoxFit.contain,
            loadingBuilder: (context, child, progress) {
              if (progress == null) return child;
              return Container(
                height: 120,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
              );
            },
            errorBuilder: (context, error, stackTrace) => Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.broken_image_outlined, size: 20, color: Color(0xFF64748B)),
                  SizedBox(width: 8),
                  Text('Image unavailable', style: TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                ],
              ),
            ),
          ),
        ),
      );
    }

    if (block.isDisplayFormula) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 6.0),
        child: Center(
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Math.tex(
              block.text,
              mathStyle: MathStyle.display,
              textStyle: textStyle ?? Theme.of(context).textTheme.bodyLarge,
              onErrorFallback: (err) => Text(block.text, style: const TextStyle(color: Colors.redAccent)),
            ),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: _buildInlineRichText(context, block.text),
    );
  }

  Widget _buildInlineRichText(BuildContext context, String text) {
    final spans = <InlineSpan>[];
    final defaultStyle = textStyle ?? Theme.of(context).textTheme.bodyLarge ?? const TextStyle(fontSize: 15, height: 1.5);

    final formulaRegex = RegExp(r'(\$[^$]+\$|\\\(.*?\\\))');
    int lastEnd = 0;

    for (final match in formulaRegex.allMatches(text)) {
      if (match.start > lastEnd) {
        spans.add(TextSpan(
          text: _cleanHtmlEntities(text.substring(lastEnd, match.start)),
          style: defaultStyle,
        ));
      }

      var rawFormula = match.group(0)!;
      if (rawFormula.startsWith(r'$') && rawFormula.endsWith(r'$')) {
        rawFormula = rawFormula.substring(1, rawFormula.length - 1);
      } else if (rawFormula.startsWith(r'\(') && rawFormula.endsWith(r'\)')) {
        rawFormula = rawFormula.substring(2, rawFormula.length - 2);
      }

      spans.add(WidgetSpan(
        alignment: PlaceholderAlignment.middle,
        child: Math.tex(
          rawFormula.trim(),
          mathStyle: MathStyle.text,
          textStyle: defaultStyle,
          onErrorFallback: (err) => Text(rawFormula, style: defaultStyle),
        ),
      ));

      lastEnd = match.end;
    }

    if (lastEnd < text.length) {
      spans.add(TextSpan(
        text: _cleanHtmlEntities(text.substring(lastEnd)),
        style: defaultStyle,
      ));
    }

    return RichText(
      text: TextSpan(children: spans),
      textAlign: textAlign,
    );
  }

  List<_ContentBlock> _parseBlocks(String raw) {
    final blocks = <_ContentBlock>[];

    var content = raw.replaceAll('\r', '');
    content = content.replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n');
    content = content.replaceAll(RegExp(r'</p>', caseSensitive: false), '\n\n');
    content = content.replaceAll(RegExp(r'</div>', caseSensitive: false), '\n');

    final imgPattern = RegExp(r'<img[^>]+src=["\x27]([^"\x27]+)["\x27][^>]*>', caseSensitive: false);
    final displayMathPattern = RegExp(r'(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\])');

    int cursor = 0;
    while (cursor < content.length) {
      final imgMatch = imgPattern.matchAsPrefix(content, cursor);
      if (imgMatch != null) {
        blocks.add(_ContentBlock(text: imgMatch.group(1)!, isImage: true, isDisplayFormula: false));
        cursor = imgMatch.end;
        continue;
      }

      final mathMatch = displayMathPattern.matchAsPrefix(content, cursor);
      if (mathMatch != null) {
        var f = mathMatch.group(0)!;
        if (f.startsWith(r'$$') && f.endsWith(r'$$')) {
          f = f.substring(2, f.length - 2);
        } else if (f.startsWith(r'\[') && f.endsWith(r'\]')) {
          f = f.substring(2, f.length - 2);
        }
        blocks.add(_ContentBlock(text: f.trim(), isImage: false, isDisplayFormula: true));
        cursor = mathMatch.end;
        continue;
      }

      final nextImg = imgPattern.firstMatch(content.substring(cursor));
      final nextMath = displayMathPattern.firstMatch(content.substring(cursor));

      int nextIdx = content.length;
      if (nextImg != null) nextIdx = cursor + nextImg.start;
      if (nextMath != null && (cursor + nextMath.start) < nextIdx) {
        nextIdx = cursor + nextMath.start;
      }

      final chunk = _stripHtml(content.substring(cursor, nextIdx)).trim();
      if (chunk.isNotEmpty) {
        blocks.add(_ContentBlock(text: chunk, isImage: false, isDisplayFormula: false));
      }

      cursor = nextIdx;
    }

    return blocks;
  }

  String _stripHtml(String str) {
    return str.replaceAll(RegExp(r'<[^>]*>'), '');
  }

  String _cleanHtmlEntities(String str) {
    return str
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&amp;', '&')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'");
  }
}

class _ContentBlock {
  final String text;
  final bool isImage;
  final bool isDisplayFormula;

  _ContentBlock({
    required this.text,
    required this.isImage,
    required this.isDisplayFormula,
  });
}
