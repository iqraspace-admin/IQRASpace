"use client";

import { HistoryList } from "./History";
import { PageTitle } from "./bits";

export function ActivityView() {
  return (
    <div>
      <PageTitle title="Activity" sub="The latest 100 changes to Duas, categories and category assignments." />
      <HistoryList linkEntity showDuaInMapping onRestored={() => {}} />
    </div>
  );
}
