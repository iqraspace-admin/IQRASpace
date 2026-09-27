import 'package:quran_flutter/features/supplications/data/datasources/supplications_local_datasource.dart';
import 'package:quran_flutter/features/supplications/domain/repositories/supplications_repository.dart';

class SupplicationsRepositoryImpl implements SupplicationsRepository {
  final SupplicationsLocalDataSource local;

  const SupplicationsRepositoryImpl(this.local);

  @override
  Future<SupplicationsContent> load() => local.load();
}
