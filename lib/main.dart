import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/practice_provider.dart';
import 'screens/home_screen.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const WegenzPracticeApp());
}

class WegenzPracticeApp extends StatelessWidget {
  const WegenzPracticeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => PracticeProvider()),
      ],
      child: MaterialApp(
        title: 'Wegenz Infinite Practice',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const HomeScreen(),
      ),
    );
  }
}
