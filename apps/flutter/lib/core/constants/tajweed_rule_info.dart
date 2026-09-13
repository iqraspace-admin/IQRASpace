import 'package:quran_flutter/l10n/app_localizations.dart';

/// Display name + plain-language description for each Tajweed rule key
/// this app colors (see core/theme/tajweed_rule_colors.dart for the code
/// → rule-key → color mapping this describes). Shown on the Tajweed
/// Rules reference screen, reached from Reader Settings.
class TajweedRuleInfo {
  final String ruleKey;
  final String name;
  final String description;

  const TajweedRuleInfo({required this.ruleKey, required this.name, required this.description});
}

/// Built from [l10n] (not a top-level `const` list) so these
/// pedagogical descriptions follow the app's UI language — plain-English
/// explanations the app authors, not Quran text itself.
List<TajweedRuleInfo> tajweedRuleInfo(AppLocalizations l10n) => [
      TajweedRuleInfo(ruleKey: 'ghn', name: l10n.tajweedRuleGhnName, description: l10n.tajweedRuleGhnDesc),
      TajweedRuleInfo(ruleKey: 'ikhf', name: l10n.tajweedRuleIkhfName, description: l10n.tajweedRuleIkhfDesc),
      TajweedRuleInfo(
        ruleKey: 'ikhf_shfw',
        name: l10n.tajweedRuleIkhfShfwName,
        description: l10n.tajweedRuleIkhfShfwDesc,
      ),
      TajweedRuleInfo(ruleKey: 'iqlb', name: l10n.tajweedRuleIqlbName, description: l10n.tajweedRuleIqlbDesc),
      TajweedRuleInfo(
        ruleKey: 'idgh_ghn',
        name: l10n.tajweedRuleIdghGhnName,
        description: l10n.tajweedRuleIdghGhnDesc,
      ),
      TajweedRuleInfo(
        ruleKey: 'idgh_w_ghn',
        name: l10n.tajweedRuleIdghWGhnName,
        description: l10n.tajweedRuleIdghWGhnDesc,
      ),
      TajweedRuleInfo(
        ruleKey: 'idghm_shfw',
        name: l10n.tajweedRuleIdghmShfwName,
        description: l10n.tajweedRuleIdghmShfwDesc,
      ),
      TajweedRuleInfo(
        ruleKey: 'idgh_mus',
        name: l10n.tajweedRuleIdghMusName,
        description: l10n.tajweedRuleIdghMusDesc,
      ),
      TajweedRuleInfo(ruleKey: 'qlq', name: l10n.tajweedRuleQlqName, description: l10n.tajweedRuleQlqDesc),
      TajweedRuleInfo(
        ruleKey: 'madda_normal',
        name: l10n.tajweedRuleMaddaNormalName,
        description: l10n.tajweedRuleMaddaNormalDesc,
      ),
      TajweedRuleInfo(
        ruleKey: 'madda_permissible',
        name: l10n.tajweedRuleMaddaPermissibleName,
        description: l10n.tajweedRuleMaddaPermissibleDesc,
      ),
      TajweedRuleInfo(
        ruleKey: 'madda_necessary',
        name: l10n.tajweedRuleMaddaNecessaryName,
        description: l10n.tajweedRuleMaddaNecessaryDesc,
      ),
      TajweedRuleInfo(
        ruleKey: 'madda_obligatory',
        name: l10n.tajweedRuleMaddaObligatoryName,
        description: l10n.tajweedRuleMaddaObligatoryDesc,
      ),
      TajweedRuleInfo(
        ruleKey: 'ham_wasl',
        name: l10n.tajweedRuleHamWaslName,
        description: l10n.tajweedRuleHamWaslDesc,
      ),
      TajweedRuleInfo(ruleKey: 'slnt', name: l10n.tajweedRuleSlntName, description: l10n.tajweedRuleSlntDesc),
    ];
