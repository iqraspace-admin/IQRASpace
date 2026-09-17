/// One selectable reciter (Al Quran Cloud audio edition). [identifier]
/// must be a real `format=audio&type=versebyverse` edition identifier —
/// confirmed against GET /v1/edition?format=audio&type=versebyverse.
class ReciterOption {
  final String identifier;
  final String displayName;

  const ReciterOption({required this.identifier, required this.displayName});
}

const reciterOptions = [
  ReciterOption(identifier: 'ar.alafasy', displayName: 'Mishary Alafasy'),
  ReciterOption(identifier: 'ar.abdulsamad', displayName: 'Abdul Basit Abdul Samad'),
  ReciterOption(identifier: 'ar.husary', displayName: 'Mahmoud Al-Husary'),
  ReciterOption(identifier: 'ar.abdurrahmaansudais', displayName: 'Abdurrahmaan As-Sudais'),
  ReciterOption(identifier: 'ar.mahermuaiqly', displayName: 'Maher Al Muaiqly'),
];

const defaultReciterIdentifier = 'ar.alafasy';
