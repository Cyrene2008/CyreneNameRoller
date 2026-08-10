// 由 scripts/build-core-bundle.mjs 生成，请勿手改。
var CyreneCore = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target2, all) => {
    for (var name in all)
      __defProp(target2, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../../packages/cyrene-core/src/index.js
  var index_exports = {};
  __export(index_exports, {
    ALGORITHM_NAME: () => ALGORITHM_NAME,
    ALGORITHM_VERSION: () => ALGORITHM_VERSION,
    CNRP_MAGIC: () => CNRP_MAGIC,
    DEFAULT_CYRENE_BALANCE_SETTINGS: () => DEFAULT_CYRENE_BALANCE_SETTINGS,
    DEFAULT_SETTINGS: () => DEFAULT_SETTINGS,
    HOST_BRIDGE_METHODS: () => HOST_BRIDGE_METHODS,
    HOST_BRIDGE_VERSION: () => HOST_BRIDGE_VERSION,
    PLUGIN_API_VERSION: () => PLUGIN_API_VERSION,
    PLUGIN_PERMISSIONS: () => PLUGIN_PERMISSIONS,
    TARGET_GAP: () => TARGET_GAP,
    UI_TREE_CONTROL_TYPES: () => UI_TREE_CONTROL_TYPES,
    UI_TREE_NODE_TYPES: () => UI_TREE_NODE_TYPES,
    UI_TREE_SCHEMA_VERSION: () => UI_TREE_SCHEMA_VERSION,
    buildRenderPlan: () => buildRenderPlan,
    comparePluginVersions: () => comparePluginVersions,
    computeCyreneBalanceProbability: () => computeCyreneBalanceProbability,
    createHostBridgeError: () => createHostBridgeError,
    createHostBridgeResult: () => createHostBridgeResult,
    executeCoreCardRequest: () => executeCoreCardRequest,
    executeCoreDrawRequest: () => executeCoreDrawRequest,
    executeCoreMaintenanceRequest: () => executeCoreMaintenanceRequest,
    normalizeAnimationPack: () => normalizeAnimationPack,
    normalizeAutoStopDuration: () => normalizeAutoStopDuration,
    normalizeCoreCaller: () => normalizeCoreCaller,
    normalizeCoreCardInput: () => normalizeCoreCardInput,
    normalizeCoreCommitState: () => normalizeCoreCommitState,
    normalizeCoreDrawInput: () => normalizeCoreDrawInput,
    normalizeCoreMaintenanceInput: () => normalizeCoreMaintenanceInput,
    normalizeCyreneBalanceSettings: () => normalizeCyreneBalanceSettings,
    normalizeFloatingWindowSize: () => normalizeFloatingWindowSize,
    normalizeFloatingWindowStyle: () => normalizeFloatingWindowStyle,
    normalizeHostBridgeRequest: () => normalizeHostBridgeRequest,
    normalizePluginManifest: () => normalizePluginManifest,
    normalizeStoredSettings: () => normalizeStoredSettings,
    normalizeUiSection: () => normalizeUiSection,
    normalizeUiTree: () => normalizeUiTree,
    permissionForMethod: () => permissionForMethod,
    personKey: () => personKey,
    pickCyreneBalanced: () => pickCyreneBalanced,
    pickCyreneBatch: () => pickCyreneBatch,
    satisfiesPluginVersion: () => satisfiesPluginVersion,
    secureRandom: () => secureRandom,
    validateHostBridgeImplementation: () => validateHostBridgeImplementation,
    validatePath: () => validatePath
  });

  // ../../packages/cyrene-core/src/balance.js
  var ALGORITHM_VERSION = "3.1.1";
  var ALGORITHM_NAME = "cyrenenameroller-balance/v3";
  var TARGET_GAP = 2;
  var COLD_START_ROUNDS = 2;
  var INTERNAL_SENSITIVITY = 0.7;
  var INTERNAL_MAX_RATIO = 3;
  var OVERFLOW_PENALTY = 0.2;
  var RECOVERY_DECAY = 0.08;
  var GUARD_FLOOR = 0.01;
  var MAX_SELECTION_PROBABILITY = 0.3;
  var UINT32_RANGE = 4294967296;
  var DEFAULT_CYRENE_BALANCE_SETTINGS = {
    enabled: true,
    algorithm: ALGORITHM_NAME
  };
  function personKey(person) {
    if (person && typeof person === "object") return String(person.id || person.cn || "");
    return String(person || "");
  }
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function capWeightShares(weightMap, names) {
    if (names.length <= 1) return weightMap;
    const maxShare = Math.max(MAX_SELECTION_PROBABILITY, 1 / names.length);
    let totalWeight = 0;
    let highestWeight = 0;
    for (const name of names) {
      const weight = weightMap.get(personKey(name)) || 0;
      totalWeight += weight;
      highestWeight = Math.max(highestWeight, weight);
    }
    if (totalWeight <= 0 || highestWeight / totalWeight <= maxShare) return weightMap;
    const remaining = new Set(names.map(personKey));
    const shares = /* @__PURE__ */ new Map();
    let remainingMass = 1;
    while (remaining.size > 0) {
      const remainingNames = [...remaining];
      const totalWeight2 = remainingNames.reduce((sum, name) => sum + (weightMap.get(name) || 0), 0);
      const newlyCapped = remainingNames.filter((name) => {
        const share = totalWeight2 > 0 ? (weightMap.get(name) || 0) / totalWeight2 * remainingMass : remainingMass / remaining.size;
        return share > maxShare;
      });
      if (newlyCapped.length === 0) {
        remainingNames.forEach((name) => {
          const share = totalWeight2 > 0 ? (weightMap.get(name) || 0) / totalWeight2 * remainingMass : remainingMass / remaining.size;
          shares.set(name, share);
        });
        break;
      }
      newlyCapped.forEach((name) => {
        shares.set(name, maxShare);
        remaining.delete(name);
        remainingMass -= maxShare;
      });
    }
    return shares;
  }
  function getCount(countsMap, person) {
    const key = personKey(person);
    const value = Number(countsMap?.[key]);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  function normalizeCyreneBalanceSettings(raw) {
    const settings = { ...DEFAULT_CYRENE_BALANCE_SETTINGS };
    if (!raw || typeof raw !== "object") return settings;
    settings.enabled = raw.enabled !== false;
    return settings;
  }
  function secureRandom() {
    if (globalThis.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      globalThis.crypto.getRandomValues(value);
      return value[0] / UINT32_RANGE;
    }
    return Math.random();
  }
  function createWeightMap(names, whiteList, countsMap, rawSettings) {
    const settings = normalizeCyreneBalanceSettings(rawSettings);
    const whiteListSet = new Set((whiteList || []).map(personKey));
    const regularNames = names.filter((name) => !whiteListSet.has(personKey(name)));
    const weights = new Map(names.map((name) => [personKey(name), 1]));
    if (!settings.enabled || regularNames.length === 0) return weights;
    const counts = new Array(regularNames.length);
    let totalDraws = 0;
    let minCount = Number.POSITIVE_INFINITY;
    let maxCount = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < regularNames.length; index++) {
      const count = getCount(countsMap, regularNames[index]);
      counts[index] = count;
      totalDraws += count;
      minCount = Math.min(minCount, count);
      maxCount = Math.max(maxCount, count);
    }
    const expectedCount = totalDraws / regularNames.length;
    const gap = maxCount - minCount;
    const warmup = clamp(totalDraws / (regularNames.length * COLD_START_ROUNDS), 0, 1);
    const gapPressure = clamp(gap / TARGET_GAP, 0, 2);
    const adaptiveGain = INTERNAL_SENSITIVITY * (0.35 + 0.65 * gapPressure);
    const rawLogWeights = new Array(counts.length);
    let rawMin = Number.POSITIVE_INFINITY;
    let rawMax = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < counts.length; index++) {
      const weight = -adaptiveGain * (counts[index] - expectedCount);
      rawLogWeights[index] = weight;
      rawMin = Math.min(rawMin, weight);
      rawMax = Math.max(rawMax, weight);
    }
    const midpoint = (rawMin + rawMax) / 2;
    const halfLogRange = Math.log(INTERNAL_MAX_RATIO) / 2;
    const minCountOccurrences = counts.reduce((total, count) => total + (count === minCount ? 1 : 0), 0);
    const secondMinCount = counts.reduce((second, count) => count > minCount && count < second ? count : second, Number.POSITIVE_INFINITY);
    regularNames.forEach((name, index) => {
      const centered = rawLogWeights[index] - midpoint;
      const bounded = clamp(centered, -halfLogRange, halfLogRange);
      const projectedCount = counts[index] + 1;
      const projectedMin = counts[index] === minCount && minCountOccurrences === 1 ? Math.min(projectedCount, secondMinCount) : minCount;
      const projectedGap = Math.max(maxCount, projectedCount) - projectedMin;
      let guard = 1;
      if (gap > TARGET_GAP && counts[index] > minCount) {
        guard = Math.max(GUARD_FLOOR, RECOVERY_DECAY ** (counts[index] - minCount));
      } else if (gap <= TARGET_GAP && projectedGap > TARGET_GAP) {
        guard = OVERFLOW_PENALTY;
      }
      weights.set(personKey(name), Math.exp(bounded * warmup) * guard);
    });
    return capWeightShares(weights, names);
  }
  function getAvailableNames(names, excludeList, allowDuplicates) {
    if (allowDuplicates || !excludeList?.length) return names;
    const excluded = new Set(excludeList.map(personKey));
    return names.filter((name) => !excluded.has(personKey(name)));
  }
  function computeCyreneBalanceProbability(names, whiteList, countsMap, settings) {
    if (!Array.isArray(names) || names.length === 0) return {};
    const weightMap = createWeightMap(names, whiteList, countsMap, settings);
    const totalWeight = names.reduce((sum, name) => sum + (weightMap.get(personKey(name)) || 1), 0);
    const probabilities = {};
    names.forEach((name) => {
      probabilities[personKey(name)] = (weightMap.get(personKey(name)) || 1) / totalWeight * 100;
    });
    return probabilities;
  }
  function pickCyreneBalanced(names, whiteList, countsMap, settings, excludeList = [], allowDuplicates = true, random = secureRandom) {
    const available = getAvailableNames(names, excludeList, allowDuplicates);
    const whiteListSet = new Set((whiteList || []).map(personKey));
    if (available.length === 0) {
      return { cn: "(\u6CA1\u4EBA\u9009\u4E86!)", en: "(No one left!)" };
    }
    const weightMap = createWeightMap(available, whiteList, countsMap, settings);
    let totalWeight = 0;
    for (const name of available) totalWeight += weightMap.get(personKey(name)) || 1;
    const randomValue = clamp(Number(random()) || 0, 0, 1 - Number.EPSILON);
    let threshold = randomValue * totalWeight;
    for (let index = 0; index < available.length; index++) {
      threshold -= weightMap.get(personKey(available[index])) || 1;
      if (threshold < 0) {
        const selected2 = available[index];
        return {
          id: selected2.id,
          cn: selected2.cn,
          en: selected2.en,
          index: names.indexOf(selected2),
          isWhiteList: whiteListSet.has(personKey(selected2))
        };
      }
    }
    const selected = available[available.length - 1];
    return {
      id: selected.id,
      cn: selected.cn,
      en: selected.en,
      index: names.indexOf(selected),
      isWhiteList: whiteListSet.has(personKey(selected))
    };
  }
  function pickCyreneBatch(names, whiteList, countsMap, settings, drawCount, allowDuplicates = true, random = secureRandom) {
    const localCounts = { ...countsMap || {} };
    const excluded = [];
    const picks = [];
    const requestedCount = Math.max(0, Math.floor(Number(drawCount) || 0));
    const limit = allowDuplicates ? requestedCount : Math.min(requestedCount, names.length);
    for (let index = 0; index < limit; index++) {
      const pick = pickCyreneBalanced(
        names,
        whiteList,
        localCounts,
        settings,
        excluded,
        allowDuplicates,
        random
      );
      if (!pick.cn || pick.cn === "(\u6CA1\u4EBA\u9009\u4E86!)") break;
      picks.push(pick);
      if (!allowDuplicates) excluded.push(personKey(pick));
      if (!pick.isWhiteList) {
        localCounts[personKey(pick)] = getCount(localCounts, pick) + 1;
      }
    }
    return picks;
  }

  // ../../packages/cyrene-core/src/protocol.js
  var DRAW_INPUT_FIELDS = /* @__PURE__ */ new Set(["listId", "target", "count", "allowDuplicates", "gender"]);
  var CARD_INPUT_FIELDS = /* @__PURE__ */ new Set(["listId", "personIds"]);
  var MAINTENANCE_ACTIONS = /* @__PURE__ */ new Set(["clear-records", "initialize-person-count"]);
  var COMMIT_FIELDS = /* @__PURE__ */ new Set(["nextStatistics", "nextRecords"]);
  var RECORD_FIELDS = /* @__PURE__ */ new Set(["personId", "listId", "groupId", "source", "pluginId", "operationId", "time"]);
  function coreError(code, message) {
    return Object.assign(new Error(message), { code });
  }
  function normalizeCoreDrawInput(raw = {}) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw coreError("CORE_TRANSACTION_REJECTED", "draw.execute \u53C2\u6570\u5FC5\u987B\u4E3A\u5BF9\u8C61");
    const unsupported = Object.keys(raw).find((key) => !DRAW_INPUT_FIELDS.has(key));
    if (unsupported) throw coreError("CORE_TRANSACTION_REJECTED", `draw.execute \u4E0D\u5141\u8BB8\u6307\u5B9A\u53C2\u6570 ${unsupported}`);
    return {
      listId: String(raw.listId || ""),
      target: raw.target === "groups" ? "groups" : "people",
      count: Math.max(1, Math.min(100, Math.floor(Number(raw.count) || 1))),
      allowDuplicates: raw.allowDuplicates === true,
      gender: ["male", "female"].includes(raw.gender) ? raw.gender : "all"
    };
  }
  function normalizeCoreCaller(raw = {}) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw coreError("CORE_TRANSACTION_REJECTED", "Core \u8C03\u7528\u65B9\u65E0\u6548");
    const kind = raw.kind === "plugin" ? "plugin" : raw.kind === "core-ui" ? "core-ui" : "";
    const pluginId = String(raw.pluginId || "");
    if (!kind || !pluginId) throw coreError("CORE_TRANSACTION_REJECTED", "Core \u8C03\u7528\u65B9\u65E0\u6548");
    return {
      kind,
      pluginId: kind === "core-ui" ? "core" : pluginId,
      operationId: String(raw.operationId || ""),
      countStatistics: raw.countStatistics !== false
    };
  }
  function normalizeCoreCardInput(raw = {}) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw coreError("CORE_TRANSACTION_REJECTED", "card.commit input must be an object");
    const unsupported = Object.keys(raw).find((key) => !CARD_INPUT_FIELDS.has(key));
    if (unsupported) throw coreError("CORE_TRANSACTION_REJECTED", `card.commit does not allow field ${unsupported}`);
    const personIds = Array.isArray(raw.personIds) ? [...new Set(raw.personIds.map((value) => String(value || "")).filter(Boolean))] : [];
    if (!personIds.length || personIds.length > 100) throw coreError("CORE_TRANSACTION_REJECTED", "card.commit requires 1 to 100 person IDs");
    return {
      listId: String(raw.listId || ""),
      personIds
    };
  }
  function normalizeCoreMaintenanceInput(raw = {}) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw coreError("CORE_TRANSACTION_REJECTED", "maintenance input must be an object");
    const unsupported = Object.keys(raw).find((key) => !["action", "listId", "personId", "mode"].includes(key));
    if (unsupported) throw coreError("CORE_TRANSACTION_REJECTED", `maintenance does not allow field ${unsupported}`);
    const action = String(raw.action || "");
    if (!MAINTENANCE_ACTIONS.has(action)) throw coreError("CORE_TRANSACTION_REJECTED", "maintenance action is not allowed");
    if (action === "clear-records") {
      if (raw.listId !== void 0 || raw.personId !== void 0 || raw.mode !== void 0) throw coreError("CORE_TRANSACTION_REJECTED", "clear-records does not accept additional fields");
      return { action };
    }
    const listId = String(raw.listId || "");
    const personId = String(raw.personId || "");
    const mode = raw.mode === "zero" ? "zero" : raw.mode === "midpoint" ? "midpoint" : "";
    if (!listId || !personId || !mode) throw coreError("CORE_TRANSACTION_REJECTED", "initialize-person-count requires listId, personId and mode");
    return { action, listId, personId, mode };
  }
  function normalizeCoreCommitState(raw = {}) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw coreError("CORE_TRANSACTION_REJECTED", "Core commit must be an object");
    const unsupported = Object.keys(raw).find((key) => !COMMIT_FIELDS.has(key));
    if (unsupported) throw coreError("CORE_TRANSACTION_REJECTED", `Core commit does not allow field ${unsupported}`);
    const statistics = raw.nextStatistics;
    if (!statistics || typeof statistics !== "object" || Array.isArray(statistics) || !statistics.counts || typeof statistics.counts !== "object" || Array.isArray(statistics.counts) || !Number.isSafeInteger(statistics.totalCount) || statistics.totalCount < 0) {
      throw coreError("CORE_TRANSACTION_REJECTED", "Core commit statistics are invalid");
    }
    if (Object.entries(statistics.counts).some(([key, value]) => !key || key.length > 256 || !Number.isSafeInteger(value) || value < 0)) {
      throw coreError("CORE_TRANSACTION_REJECTED", "Core commit counts are invalid");
    }
    if (!Array.isArray(raw.nextRecords) || raw.nextRecords.length > 500) throw coreError("CORE_TRANSACTION_REJECTED", "Core commit records are invalid");
    for (const record of raw.nextRecords) {
      if (!record || typeof record !== "object" || Array.isArray(record) || Object.keys(record).some((key) => !RECORD_FIELDS.has(key)) || !["string", "object"].includes(typeof record.personId) || record.personId !== null && typeof record.personId !== "string" || !["string", "object"].includes(typeof record.listId) || record.listId !== null && typeof record.listId !== "string" || !["string", "object"].includes(typeof record.groupId) || record.groupId !== null && typeof record.groupId !== "string" || typeof record.source !== "string" || typeof record.pluginId !== "string" || typeof record.operationId !== "string" || !Number.isFinite(record.time) || record.time < 0) {
        throw coreError("CORE_TRANSACTION_REJECTED", "Core commit record is invalid");
      }
    }
    return {
      nextStatistics: JSON.parse(JSON.stringify(statistics)),
      nextRecords: JSON.parse(JSON.stringify(raw.nextRecords))
    };
  }
  var CORE_DRAW_INPUT_FIELDS = Object.freeze([...DRAW_INPUT_FIELDS]);
  var CORE_CARD_INPUT_FIELDS = Object.freeze([...CARD_INPUT_FIELDS]);
  var CORE_MAINTENANCE_ACTIONS = Object.freeze([...MAINTENANCE_ACTIONS]);

  // ../../packages/cyrene-core/src/core-service.js
  function coreError2(code, message) {
    return Object.assign(new Error(message), { code });
  }
  function executeCoreDrawRequest({ input: rawInput, caller: rawCaller, state, peopleCache }) {
    const input = normalizeCoreDrawInput(rawInput);
    const caller = normalizeCoreCaller(rawCaller);
    if (!state || typeof state !== "object" || Array.isArray(state)) throw coreError2("CORE_TRANSACTION_REJECTED", "Core \u72B6\u6001\u65E0\u6548");
    const list = state.names?.lists?.[input.listId];
    if (!list) throw coreError2("CORE_TRANSACTION_REJECTED", "\u62BD\u53D6\u540D\u5355\u4E0D\u5B58\u5728");
    const operationId = caller.operationId || crypto.randomUUID?.() || `draw-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const committedAt = Date.now();
    let picks;
    if (input.target === "groups") {
      const groups = (list.groups || []).map((group) => ({ id: group.id, cn: group.name, en: group.enName || "", isGroup: true }));
      if ((list.names || []).some((person) => !person.groupId)) groups.push({ id: "__unassigned__", cn: "\u672A\u5206\u7EC4", en: "Unassigned", isGroup: true });
      if (!groups.length) throw coreError2("CORE_TRANSACTION_REJECTED", "\u6240\u9009\u540D\u5355\u6CA1\u6709\u53EF\u62BD\u53D6\u5C0F\u7EC4");
      const count = input.allowDuplicates ? input.count : Math.min(input.count, groups.length);
      const available = [...groups];
      picks = [];
      for (let index = 0; index < count; index += 1) {
        const pool = input.allowDuplicates ? groups : available;
        const selectedIndex = Math.min(pool.length - 1, Math.floor(secureRandom() * pool.length));
        picks.push(pool[selectedIndex]);
        if (!input.allowDuplicates) available.splice(selectedIndex, 1);
      }
    } else {
      const cacheKey = `${input.listId}:${input.gender}`;
      let eligible = peopleCache?.get(cacheKey);
      if (!eligible) {
        const people2 = (list.names || []).filter((person) => person.cn && person.cn !== "\u518D\u6765\u4E00\u6B21" && (input.gender === "all" || person.gender === input.gender));
        eligible = { people: people2, whiteList: people2.filter((person) => person.isWhiteList) };
        peopleCache?.set(cacheKey, eligible);
      }
      const { people, whiteList } = eligible;
      if (!people.length) throw coreError2("CORE_TRANSACTION_REJECTED", "\u6240\u9009\u540D\u5355\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u4EBA\u5458");
      const count = input.allowDuplicates ? input.count : Math.min(input.count, people.length);
      picks = pickCyreneBatch(people, whiteList, state.statistics?.counts || {}, normalizeCyreneBalanceSettings(state.balance), count, input.allowDuplicates);
    }
    const results = picks.map((pick) => ({ id: pick.id || "", name: pick.cn || "", englishName: pick.en || "", isGroup: !!pick.isGroup, isWhiteList: !!pick.isWhiteList }));
    const receipt = {
      operationId,
      pluginId: caller.pluginId,
      listId: input.listId,
      target: input.target,
      count: results.length,
      allowDuplicates: input.allowDuplicates,
      gender: input.gender,
      algorithm: input.target === "people" ? ALGORITHM_NAME : "host-random/groups",
      algorithmVersion: input.target === "people" ? ALGORITHM_VERSION : "1",
      committedAt,
      results
    };
    const nextStatistics = { counts: { ...state.statistics?.counts || {} }, totalCount: Math.max(0, Number(state.statistics?.totalCount) || 0) };
    if (caller.countStatistics && input.target === "people") {
      for (const pick of picks) {
        if (pick.isWhiteList) continue;
        const key = personKey(pick);
        if (!key) continue;
        nextStatistics.counts[key] = (Number(nextStatistics.counts[key]) || 0) + 1;
        nextStatistics.totalCount += 1;
      }
    }
    const source = caller.kind === "plugin" ? `plugin:${caller.pluginId}` : "roller";
    const appended = picks.map((pick) => ({
      personId: pick.isGroup ? null : pick.id || null,
      listId: input.listId,
      groupId: pick.isGroup ? pick.id : null,
      source,
      pluginId: caller.kind === "plugin" ? caller.pluginId : "",
      operationId,
      time: committedAt
    }));
    const nextRecords = [...appended, ...Array.isArray(state.records) ? state.records : []].slice(0, 500);
    return { receipt, nextStatistics, nextRecords };
  }
  function executeCoreCardRequest({ input: rawInput, caller: rawCaller, state }) {
    const input = normalizeCoreCardInput(rawInput);
    const caller = normalizeCoreCaller(rawCaller);
    if (caller.kind !== "core-ui") throw coreError2("PLUGIN_PERMISSION_DENIED", "card.commit \u4EC5\u5141\u8BB8\u5BBF\u4E3B\u754C\u9762\u8C03\u7528");
    if (!state || typeof state !== "object" || Array.isArray(state)) throw coreError2("CORE_TRANSACTION_REJECTED", "Core \u72B6\u6001\u65E0\u6548");
    const list = state.names?.lists?.[input.listId];
    if (!list) throw coreError2("CORE_TRANSACTION_REJECTED", "\u5361\u724C\u540D\u5355\u4E0D\u5B58\u5728");
    const people = Array.isArray(list.names) ? list.names : [];
    const byId = new Map(people.map((person) => [String(person?.id || ""), person]));
    const selected = input.personIds.map((id) => byId.get(id));
    if (selected.some((person) => !person || person.isWhiteList)) throw coreError2("CORE_TRANSACTION_REJECTED", "\u5361\u724C\u7ED3\u679C\u4E0D\u5C5E\u4E8E\u5F53\u524D\u53EF\u62BD\u53D6\u540D\u5355");
    const operationId = caller.operationId || crypto.randomUUID?.() || `card-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const committedAt = Date.now();
    const results = selected.map((person) => ({ id: String(person.id), name: String(person.cn || ""), englishName: String(person.en || "") }));
    const receipt = { kind: "card", operationId, pluginId: caller.pluginId, listId: input.listId, count: results.length, committedAt, results };
    const appended = results.map((result) => ({
      personId: result.id,
      listId: input.listId,
      groupId: null,
      source: "card",
      pluginId: "",
      operationId,
      time: committedAt
    }));
    const nextRecords = [...appended, ...Array.isArray(state.records) ? state.records : []].slice(0, 500);
    return { receipt, nextStatistics: { ...state.statistics || { counts: {}, totalCount: 0 }, counts: { ...state.statistics?.counts || {} } }, nextRecords };
  }
  function executeCoreMaintenanceRequest({ input: rawInput, caller: rawCaller, state }) {
    const input = normalizeCoreMaintenanceInput(rawInput);
    const caller = normalizeCoreCaller(rawCaller);
    if (caller.kind !== "core-ui") throw coreError2("PLUGIN_PERMISSION_DENIED", "maintenance is host-only");
    if (!state || typeof state !== "object" || Array.isArray(state)) throw coreError2("CORE_TRANSACTION_REJECTED", "Core state is invalid");
    const nextStatistics = { ...state.statistics || { counts: {}, totalCount: 0 }, counts: { ...state.statistics?.counts || {} } };
    let nextRecords = Array.isArray(state.records) ? [...state.records] : [];
    if (input.action === "clear-records") {
      nextRecords = [];
    } else {
      const list = state.names?.lists?.[input.listId];
      const people = Array.isArray(list?.names) ? list.names : [];
      const person = people.find((item) => String(item?.id || "") === input.personId);
      if (!person || person.isWhiteList) throw coreError2("CORE_TRANSACTION_REJECTED", "person is not eligible for statistics initialization");
      if (nextStatistics.counts[input.personId] === void 0) {
        const existingCounts = people.filter((item) => String(item?.id || "") !== input.personId && !item?.isWhiteList && item?.cn).map((item) => Number(nextStatistics.counts[String(item.id || "")]) || 0);
        let minCount = Number.POSITIVE_INFINITY;
        let maxCount = Number.NEGATIVE_INFINITY;
        for (const count of existingCounts) {
          minCount = Math.min(minCount, count);
          maxCount = Math.max(maxCount, count);
        }
        const initialCount = input.mode === "zero" || existingCounts.length === 0 ? 0 : Math.round((minCount + maxCount) / 2);
        nextStatistics.counts[input.personId] = initialCount;
        nextStatistics.totalCount = Math.max(0, Number(nextStatistics.totalCount) || 0) + initialCount;
      }
    }
    const committedAt = Date.now();
    return {
      receipt: {
        kind: "maintenance",
        action: input.action,
        operationId: caller.operationId || `maintenance-${committedAt}`,
        pluginId: "core",
        committedAt
      },
      nextStatistics,
      nextRecords
    };
  }

  // ../../packages/cyrene-core/src/storage.js
  var DEFAULT_SETTINGS = {
    recordCounts: true,
    rainbowNames: true,
    englishMode: false,
    language: "zh",
    groupMode: false,
    multiMode: false,
    peopleCount: 2,
    allowDuplicates: false,
    forbidDuplicates: false,
    multiStepStop: true,
    autoStop: false,
    autoStopDuration: 3,
    finishAnimation: "spotlight",
    stepStopInterval: 0.15,
    theme: "default",
    colorTheme: "peach",
    customThemeColor: "#0078d4",
    downloadSource: "ghproxy",
    particles: true,
    blur: true,
    animSpeed: 1,
    uiScale: 100,
    uiScaleVersion: 2,
    nameFontSize: 1,
    fontFamily: "MiSans",
    darkMode: false,
    nameColorMode: "gradient",
    customNameColorLight: "#d04a9d",
    customNameColorDark: "#f09bd7",
    perfBlur: true,
    perfShadows: true,
    perfAnimations: true,
    dockCollapsed: false,
    disableSplash: false,
    floatingWindowEnabled: false,
    floatingWindowStyle: "text",
    floatingWindowSize: 64,
    floatingCompassHintDismissed: false,
    autoStart: false,
    autoStartMode: "registry",
    autoStartToTray: false,
    uriSchemeEnabled: false,
    newMemberCountMode: "midpoint"
  };
  var FLOATING_WINDOW_STYLES = ["text", "image1", "image2", "image3"];
  var MIN_FLOATING_WINDOW_SIZE = 40;
  var MAX_FLOATING_WINDOW_SIZE = 256;
  var FLOATING_WINDOW_SIZE_STEP = 4;
  var DEFAULT_FLOATING_WINDOW_SIZE = 64;
  var DEFAULT_AUTO_STOP_DURATION = 3;
  var MIN_AUTO_STOP_DURATION = 1;
  var MAX_AUTO_STOP_DURATION = 60;
  function normalizeFloatingWindowStyle(value) {
    return FLOATING_WINDOW_STYLES.includes(value) ? value : "text";
  }
  function normalizeFloatingWindowSize(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return DEFAULT_FLOATING_WINDOW_SIZE;
    const rounded = Math.round(number / FLOATING_WINDOW_SIZE_STEP) * FLOATING_WINDOW_SIZE_STEP;
    return Math.min(MAX_FLOATING_WINDOW_SIZE, Math.max(MIN_FLOATING_WINDOW_SIZE, rounded));
  }
  function normalizeAutoStopDuration(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return DEFAULT_AUTO_STOP_DURATION;
    return Math.min(MAX_AUTO_STOP_DURATION, Math.max(MIN_AUTO_STOP_DURATION, Math.round(parsed)));
  }
  function normalizeStoredSettings(raw) {
    const hasSaved = raw && typeof raw === "object" && !Array.isArray(raw);
    const saved = hasSaved ? raw : {};
    const settings = { ...DEFAULT_SETTINGS, ...saved };
    if (hasSaved && (!saved.uiScaleVersion || saved.uiScaleVersion < 2)) {
      settings.uiScale = Math.round((saved.uiScale || 100) * 0.8);
      settings.uiScaleVersion = 2;
    }
    settings.newMemberCountMode = settings.newMemberCountMode === "zero" ? "zero" : "midpoint";
    settings.floatingWindowStyle = normalizeFloatingWindowStyle(settings.floatingWindowStyle);
    settings.floatingWindowSize = normalizeFloatingWindowSize(settings.floatingWindowSize);
    settings.autoStopDuration = normalizeAutoStopDuration(settings.autoStopDuration);
    return settings;
  }

  // ../../packages/cyrene-core/src/host-bridge.js
  var HOST_BRIDGE_VERSION = "1.0.0";
  var HOST_BRIDGE_METHODS = Object.freeze([
    { id: "runtime.platform", permission: null, group: "platform", description: "\u5BBF\u4E3B\u5E73\u53F0\u4FE1\u606F" },
    { id: "runtime.capabilities", permission: null, group: "platform", description: "\u5BBF\u4E3B\u80FD\u529B\u58F0\u660E" },
    { id: "host.describe", permission: null, group: "host", description: "\u5BBF\u4E3B\u73AF\u5883\u63CF\u8FF0" },
    { id: "storage.read", permission: "storage:read", group: "storage", description: "\u8BFB\u53D6\u63D2\u4EF6\u5B58\u50A8" },
    { id: "storage.write", permission: "storage:write", group: "storage", description: "\u5199\u5165\u63D2\u4EF6\u5B58\u50A8" },
    { id: "dependency.storage.read", permission: null, group: "storage", description: "\u8BFB\u53D6\u524D\u7F6E\u63D2\u4EF6\u5171\u4EAB\u6570\u636E\uFF08\u9700\u53CC\u65B9\u58F0\u660E\uFF09" },
    { id: "names.read", permission: "names:read", group: "core-snapshot", description: "\u6838\u5FC3\u5FEB\u7167\uFF1A\u540D\u5355" },
    { id: "records.read", permission: "records:read", group: "core-snapshot", description: "\u6838\u5FC3\u5FEB\u7167\uFF1A\u8BB0\u5F55" },
    { id: "statistics.read", permission: "statistics:read", group: "core-snapshot", description: "\u6838\u5FC3\u5FEB\u7167\uFF1A\u7EDF\u8BA1" },
    { id: "balance.read", permission: "balance:read", group: "core-snapshot", description: "\u6838\u5FC3\u5FEB\u7167\uFF1A\u5E73\u8861\u914D\u7F6E" },
    { id: "resources.query", permission: null, group: "core-snapshot", description: "\u5BBF\u4E3B\u8D44\u6E90\u67E5\u8BE2\uFF08\u767D\u540D\u5355\uFF09" },
    { id: "draw.execute", permission: "draw:execute", group: "core-transaction", description: "\u6267\u884C\u62BD\u53D6\u4E8B\u52A1" },
    { id: "transactions.execute", permission: null, group: "core-transaction", description: "\u5BBF\u4E3B\u4E8B\u52A1\uFF08\u767D\u540D\u5355\uFF09" },
    { id: "notifications.show", permission: "notifications:show", group: "ui", description: "\u663E\u793A\u901A\u77E5\u6A2A\u5E45" },
    { id: "audio.select", permission: "audio:select", group: "audio", description: "\u9009\u62E9\u672C\u5730\u97F3\u9891\u6587\u4EF6" },
    { id: "audio.play", permission: "audio:play", group: "audio", description: "\u64AD\u653E\u5DF2\u9009\u62E9\u97F3\u9891\uFF08data: URL\uFF09" },
    { id: "system.open-url", permission: "system:open-url", group: "system", description: "\u6253\u5F00\u5916\u90E8\u94FE\u63A5" },
    { id: "system.select-file", permission: "system:select-file", group: "system", description: "\u9009\u62E9\u6587\u4EF6" },
    { id: "system.select-directory", permission: "system:select-directory", group: "system", description: "\u9009\u62E9\u76EE\u5F55" },
    { id: "system.clipboard-read", permission: "system:clipboard-read", group: "system", description: "\u8BFB\u53D6\u526A\u8D34\u677F" },
    { id: "system.clipboard-write", permission: "system:clipboard-write", group: "system", description: "\u5199\u5165\u526A\u8D34\u677F" },
    { id: "system.reveal-file", permission: "system:reveal-file", group: "system", description: "\u8D44\u6E90\u7BA1\u7406\u5668\u4E2D\u663E\u793A\u6587\u4EF6" },
    { id: "system.execute", permission: "system:execute", group: "system", description: "\u6267\u884C\u53D7\u7BA1\u7CFB\u7EDF\u64CD\u4F5C\uFF08\u767D\u540D\u5355\u547D\u4EE4\uFF09" },
    { id: "ui.render", permission: "ui:pages", group: "ui", description: "SDK v2\uFF1A\u6E32\u67D3 UI \u58F0\u660E\u6811" },
    { id: "ui.action", permission: "ui:pages", group: "ui", description: "SDK v2\uFF1AUI \u4E8B\u4EF6\u56DE\u4F20" }
  ]);
  function permissionForMethod(method) {
    return HOST_BRIDGE_METHODS.find((item) => item.id === method)?.permission || null;
  }
  function validateHostBridgeImplementation(impl) {
    const missing = HOST_BRIDGE_METHODS.filter((item) => typeof impl?.[item.id] !== "function").map((item) => item.id);
    if (missing.length) {
      throw new Error(`HostBridge \u5B9E\u73B0\u7F3A\u5C11\u65B9\u6CD5\uFF1A${missing.join(", ")}`);
    }
    return true;
  }
  var HOST_BRIDGE_REQUEST_FIELDS = Object.freeze(["method", "args", "requestId"]);
  function normalizeHostBridgeRequest(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("HostBridge \u8BF7\u6C42\u5FC5\u987B\u4E3A\u5BF9\u8C61");
    const unsupported = Object.keys(raw).find((key) => !HOST_BRIDGE_REQUEST_FIELDS.includes(key));
    if (unsupported) throw new Error(`HostBridge \u8BF7\u6C42\u4E0D\u5141\u8BB8\u5B57\u6BB5 ${unsupported}`);
    const method = String(raw.method || "");
    if (!HOST_BRIDGE_METHODS.some((item) => item.id === method)) throw new Error(`\u672A\u77E5 HostBridge \u65B9\u6CD5\uFF1A${method}`);
    const requestId = String(raw.requestId || "");
    if (!requestId || requestId.length > 128) throw new Error("HostBridge \u8BF7\u6C42\u7F3A\u5C11 requestId");
    const args = raw.args && typeof raw.args === "object" && !Array.isArray(raw.args) ? JSON.parse(JSON.stringify(raw.args)) : {};
    return { method, requestId, args };
  }
  function createHostBridgeResult(value) {
    return { ok: true, value: JSON.parse(JSON.stringify(value)) };
  }
  function createHostBridgeError(error) {
    return { ok: false, error: { code: error?.code || "HOST_BRIDGE_FAILED", message: String(error?.message || error) } };
  }

  // ../../packages/cyrene-core/src/ui-policies/component-registry.js
  var target = (id, policy, allowedStyles, extra = {}) => Object.freeze({
    id,
    platform: "all",
    visibilityPolicy: policy,
    allowedStyles: Object.freeze([...allowedStyles]),
    ...extra
  });
  var COMPONENT_TARGETS = Object.freeze({
    "app.title-bar": target("app.title-bar", "required", ["foreground", "background", "fontFamily", "fontSize", "fontWeight", "density"], { platform: "tauri", selector: ".titlebar" }),
    "app.version-badge": target("app.version-badge", "optional", ["foreground", "background", "fontSize", "fontWeight", "fontFamily", "padding", "gap"], { selector: ".version-badge", allowPluginFonts: true }),
    "navigation.dock": target("navigation.dock", "required", ["size", "foreground", "background", "fontSize", "fontWeight", "fontFamily", "density"], { selector: ".dock" }),
    "navigation.settings-entry": target("navigation.settings-entry", "protected", [], { selector: null, mappingStatus: "requires-host-boundary-wrapper" }),
    "roller.current-list": target("roller.current-list", "required", ["size", "foreground", "background", "fontSize", "fontWeight", "fontFamily", "padding", "gap"], { selector: ".list-selector-bar", identity: true }),
    "roller.filters": target("roller.filters", "optional", ["size", "foreground", "background", "fontSize", "fontWeight", "fontFamily", "padding", "gap"], { selector: [".switches", ".multi-settings"], allowedLayouts: ["collapse", "reserve", "compact"], allowPluginFonts: true }),
    "roller.primary-action": target("roller.primary-action", "required", ["size", "foreground", "background", "accent", "fontSize", "fontWeight", "fontFamily", "radius"], { selector: ".start-btn" }),
    "roller.result": target("roller.result", "protected", ["size", "foreground", "background", "accent", "fontFamily", "fontSize", "fontWeight", "padding", "gap", "radius", "borderColor", "borderWidth", "shadow", "alignment"], { selector: [".display-container", ".name-display"], authoritativeText: true, allowPluginFonts: false }),
    "card.controls": target("card.controls", "replaceable", ["size", "foreground", "background", "fontSize", "fontWeight", "fontFamily", "padding", "gap"], { selector: ".card-controls" }),
    "card.deck": target("card.deck", "required", ["size", "padding", "gap", "foreground", "background"], { selector: ".cards-grid" }),
    "card.item": target("card.item", "required", ["size", "foreground", "background", "fontSize", "fontWeight", "fontFamily", "radius", "shadow"], { selector: [".card", ".card-face"] }),
    "lottery.result": target("lottery.result", "protected", ["size", "foreground", "background", "accent", "fontFamily", "fontSize", "fontWeight", "padding", "gap", "radius", "borderColor", "borderWidth", "shadow", "alignment"], { selector: [".roller-result", ".wheel-result"], authoritativeText: true, allowPluginFonts: false }),
    "statistics.summary": target("statistics.summary", "optional", ["size", "foreground", "background", "fontSize", "fontWeight", "fontFamily", "padding", "gap"], { selector: ".stats-summary" })
  });
  var COMPONENT_TARGET_IDS = Object.freeze(Object.keys(COMPONENT_TARGETS));
  var COMPONENT_STYLE_PROPERTIES = Object.freeze([
    "size",
    "scale",
    "foreground",
    "background",
    "accent",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "lineHeight",
    "padding",
    "gap",
    "radius",
    "borderColor",
    "borderWidth",
    "shadow",
    "alignment",
    "density"
  ]);
  function getComponentTarget(id, platform = "web") {
    const descriptor = COMPONENT_TARGETS[String(id || "")];
    if (!descriptor) return null;
    if (descriptor.platform !== "all" && descriptor.platform !== platform) return { ...descriptor, available: false };
    return { ...descriptor, available: true };
  }

  // ../../packages/cyrene-core/src/ui-policies/style-policy.js
  var HOST_FONTS = /* @__PURE__ */ new Set(["host:ui", "host:display", "host:numeric"]);
  var FONT_ALIAS_PATTERN = /^plugin:([a-z0-9]+(?:[._-][a-z0-9]+)+)\/([a-z][a-z0-9._-]{0,63})$/;
  var COLOR_PATTERN = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
  var RGB_PATTERN = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i;
  var FORBIDDEN_VALUE = /url\s*\(|var\s*\(|calc\s*\(|env\s*\(|image-set\s*\(|@import|[{};<>\\]/i;
  var FORBIDDEN_PROPERTIES = /* @__PURE__ */ new Set(["selector", "css", "cssFile", "display", "visibility", "content", "position", "inset", "top", "left", "right", "bottom", "zIndex", "z-index", "pointerEvents", "pointer-events", "overflow", "transform", "opacity"]);
  function policyError(code, message, details = {}) {
    const error = new Error(message);
    error.code = code;
    Object.assign(error, details);
    return error;
  }
  function fail(code, message, details) {
    throw policyError(code, message, details);
  }
  function normalizeColor(value, label) {
    const source = String(value || "").trim();
    if (COLOR_PATTERN.test(source)) return source.toLowerCase();
    const rgb2 = source.match(RGB_PATTERN);
    if (!rgb2 || rgb2.slice(1, 4).some((channel) => Number(channel) > 255)) fail("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${label} \u989C\u8272\u503C\u65E0\u6548`);
    if (source.toLowerCase().startsWith("rgba") && rgb2[4] === void 0) fail("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${label} rgba \u7F3A\u5C11\u900F\u660E\u5EA6`);
    return source.replace(/\s+/g, " ");
  }
  function rgb(value) {
    const source = String(value || "");
    const hex = source.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
      const raw = hex[1].length === 3 ? hex[1].split("").map((c) => c + c).join("") : hex[1];
      return [0, 2, 4].map((index) => parseInt(raw.slice(index, index + 2), 16));
    }
    const match = source.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
    return match ? match.slice(1).map(Number) : null;
  }
  function contrastRatio(foreground, background) {
    const channel = (value) => {
      const normalized = value / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (color) => color.map(channel).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const first = luminance(foreground);
    const second = luminance(background);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  }
  var RANGE = {
    scale: [0.8, 1.5],
    lineHeight: [1.1, 1.8],
    radius: [0, 16],
    borderWidth: [0, 3],
    fontSize: [8, 120],
    fontWeight: [400, 800]
  };
  var ENUMS = {
    size: /* @__PURE__ */ new Set(["small", "medium", "large"]),
    padding: /* @__PURE__ */ new Set(["compact", "normal", "comfortable"]),
    gap: /* @__PURE__ */ new Set(["compact", "normal", "comfortable"]),
    shadow: /* @__PURE__ */ new Set(["none", "small", "medium", "large"]),
    alignment: /* @__PURE__ */ new Set(["start", "center", "end"]),
    density: /* @__PURE__ */ new Set(["compact", "normal", "comfortable"])
  };
  var TARGET_SIZE_VALUES = Object.freeze({
    "navigation.dock": { small: "200px", medium: "240px", large: "280px" },
    "roller.current-list": { small: "280px", medium: "360px", large: "480px" },
    "roller.filters": { small: "240px", medium: "280px", large: "340px" },
    "roller.primary-action": { small: "240px", medium: "280px", large: "340px" },
    "roller.result": { small: "44px", medium: "64px", large: "88px" },
    "card.controls": { small: "64px", medium: "80px", large: "96px" },
    "card.deck": { small: "120px", medium: "140px", large: "170px" },
    "card.item": { small: "120px", medium: "140px", large: "170px" },
    "lottery.result": { small: "32px", medium: "48px", large: "72px" },
    "statistics.summary": { small: "64px", medium: "80px", large: "96px" }
  });
  var TARGET_DENSITY_VALUES = Object.freeze({
    "app.title-bar": { compact: "34px", normal: "40px", comfortable: "48px" },
    "navigation.dock": { compact: "6px", normal: "8px", comfortable: "12px" }
  });
  function normalizeProperty(property, value, descriptor, label, pluginId = "") {
    if (FORBIDDEN_PROPERTIES.has(property) || !COMPONENT_STYLE_PROPERTIES.includes(property)) fail("PLUGIN_UI_PROPERTY_NOT_ALLOWED", `${label}.${property} \u4E0D\u5141\u8BB8`);
    if (!descriptor.allowedStyles.includes(property)) fail(descriptor.visibilityPolicy === "protected" ? "PLUGIN_UI_PROTECTED_TARGET" : "PLUGIN_UI_PROPERTY_NOT_ALLOWED", `${label}.${property} \u4E0D\u5141\u8BB8\u7528\u4E8E\u76EE\u6807 ${descriptor.id}`);
    if (["foreground", "background", "accent", "borderColor"].includes(property)) return normalizeColor(value, `${label}.${property}`);
    if (property === "fontFamily") {
      const font = String(value || "");
      if (HOST_FONTS.has(font)) return font;
      const match = font.match(FONT_ALIAS_PATTERN);
      if (!match || pluginId && match[1] !== pluginId || descriptor.allowPluginFonts !== true) fail(descriptor.allowPluginFonts !== true ? "PLUGIN_UI_FONT_NOT_ALLOWED_FOR_TARGET" : "PLUGIN_UI_VALUE_OUT_OF_RANGE", `${label}.fontFamily \u4E0D\u5141\u8BB8`);
      return font;
    }
    if (RANGE[property]) {
      const number = Number(value);
      if (!Number.isFinite(number) || number < RANGE[property][0] || number > RANGE[property][1] || property === "fontWeight" && ![400, 500, 600, 700, 800].includes(number)) fail("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${label}.${property} \u8D85\u51FA\u5141\u8BB8\u8303\u56F4`);
      return number;
    }
    if (ENUMS[property]) {
      const normalized = String(value);
      if (!ENUMS[property].has(normalized)) fail("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${label}.${property} \u503C\u65E0\u6548`);
      return normalized;
    }
    if (typeof value === "string" && FORBIDDEN_VALUE.test(value)) fail("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${label}.${property} \u5305\u542B\u4E0D\u5B89\u5168\u503C`);
    return value;
  }
  function normalizeComponentStylePack(value, declaration = {}, { platform = "web", pluginId = "" } = {}) {
    const id = String(declaration.id || value?.id || "");
    if (!value || typeof value !== "object" || Array.isArray(value)) fail("PLUGIN_UI_SCHEMA_INVALID", `\u7EC4\u4EF6\u6837\u5F0F\u5305 ${id} \u65E0\u6548`);
    if (!id || !/^[a-z][a-z0-9._-]{0,63}$/.test(id)) fail("PLUGIN_UI_SCHEMA_INVALID", `\u7EC4\u4EF6\u6837\u5F0F\u5305 ${id || "unknown"} ID \u65E0\u6548`);
    const targets = value.targets;
    if (!targets || typeof targets !== "object" || Array.isArray(targets)) fail("PLUGIN_UI_SCHEMA_INVALID", `\u7EC4\u4EF6\u6837\u5F0F\u5305 ${id} \u7F3A\u5C11 targets`);
    const normalizedTargets = {};
    for (const [targetId, rawStyles] of Object.entries(targets)) {
      const descriptor = getComponentTarget(targetId, platform);
      if (!descriptor) fail("PLUGIN_UI_UNKNOWN_TARGET", `\u672A\u77E5\u7EC4\u4EF6\u76EE\u6807\uFF1A${targetId}`);
      if (!descriptor.available) continue;
      if (!rawStyles || typeof rawStyles !== "object" || Array.isArray(rawStyles)) fail("PLUGIN_UI_SCHEMA_INVALID", `${targetId} \u6837\u5F0F\u65E0\u6548`);
      const styles = {};
      for (const [property, raw] of Object.entries(rawStyles)) styles[property] = normalizeProperty(property, raw, descriptor, `${id}.${targetId}`, pluginId);
      const foreground = rgb(styles.foreground);
      const background = rgb(styles.background);
      if (descriptor.visibilityPolicy === "protected" || descriptor.visibilityPolicy === "required") {
        if (styles.foreground && !foreground || styles.background && !background) fail("PLUGIN_UI_CONTRAST_TOO_LOW", `${targetId} \u6743\u5A01\u76EE\u6807\u989C\u8272\u5FC5\u987B\u662F\u4E0D\u900F\u660E\u989C\u8272`);
        const combinations = foreground && background ? [[foreground, background]] : foreground ? [[foreground, [255, 247, 252]], [foreground, [31, 23, 29]]] : background ? [[[42, 23, 35], background], [[245, 238, 243], background]] : [];
        if (combinations.some(([fg, bg]) => contrastRatio(fg, bg) < 4.5)) fail("PLUGIN_UI_CONTRAST_TOO_LOW", `${targetId} \u524D\u666F\u4E0E\u80CC\u666F\u5BF9\u6BD4\u5EA6\u4F4E\u4E8E 4.5:1`);
      }
      normalizedTargets[targetId] = styles;
    }
    return { id, title: String(value.title || declaration.title || id).slice(0, 120), description: String(value.description || "").slice(0, 300), targets: normalizedTargets };
  }
  function normalizeComponentStylePacks(value, permissions, options = {}) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:component-styles")) fail("PLUGIN_PERMISSION_DENIED", "componentStylePacks \u9700\u8981 ui:component-styles \u6743\u9650");
    if (!Array.isArray(value) || value.length > 16) fail("PLUGIN_UI_SCHEMA_INVALID", "componentStylePacks \u6700\u591A 16 \u9879");
    const ids = /* @__PURE__ */ new Set();
    return value.map((declaration, index) => {
      if (!declaration || typeof declaration !== "object" || !/^[a-z][a-z0-9._-]{0,63}$/.test(declaration.id || "") || ids.has(declaration.id)) fail("PLUGIN_UI_SCHEMA_INVALID", `componentStylePacks[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(declaration.id);
      return normalizeComponentStylePack(declaration.data || declaration, declaration, options);
    });
  }

  // ../../packages/cyrene-core/src/ui-policies/font-policy.js
  var FONT_ID_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/;
  function normalizeFonts(value, permissions, { pluginId = "" } = {}) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:fonts")) {
      const error = new Error("fonts \u9700\u8981 ui:fonts \u6743\u9650");
      error.code = "PLUGIN_PERMISSION_DENIED";
      throw error;
    }
    if (!Array.isArray(value) || value.length > 8) throw Object.assign(new Error("fonts \u6700\u591A 8 \u9879"), { code: "PLUGIN_UI_SCHEMA_INVALID" });
    const ids = /* @__PURE__ */ new Set();
    return value.map((raw, index) => {
      const id = String(raw?.id || "");
      if (!FONT_ID_PATTERN.test(id) || ids.has(id)) throw Object.assign(new Error(`fonts[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`), { code: "PLUGIN_UI_SCHEMA_INVALID" });
      ids.add(id);
      const source = String(raw.source || "").replace(/\\/g, "/");
      if (!source.toLowerCase().endsWith(".woff2") || !source || source.startsWith("/") || source.includes("../") || source.includes("/..")) throw Object.assign(new Error(`fonts[${index}] \u4EC5\u5141\u8BB8\u5305\u5185 .woff2`), { code: "PLUGIN_UI_FONT_NOT_ALLOWED" });
      const weight = raw.weight === void 0 ? 400 : Number(raw.weight);
      if (![400, 500, 600, 700, 800].includes(weight)) throw Object.assign(new Error(`fonts[${index}].weight \u65E0\u6548`), { code: "PLUGIN_UI_VALUE_OUT_OF_RANGE" });
      const style = raw.style === "italic" ? "italic" : "normal";
      return { id, source, weight, style, family: pluginId ? `plugin:${pluginId}/${id}` : "" };
    });
  }

  // ../../packages/cyrene-core/src/ui-policies/override-policy.js
  var VISIBILITIES = /* @__PURE__ */ new Set(["visible", "hidden", "replaced"]);
  var LAYOUTS = /* @__PURE__ */ new Set(["collapse", "reserve", "compact"]);
  function fail2(code, message) {
    throw Object.assign(new Error(message), { code });
  }
  function normalizeComponentOverridePacks(value, permissions, { platform = "web" } = {}) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:component-overrides")) fail2("PLUGIN_PERMISSION_DENIED", "componentOverridePacks \u9700\u8981 ui:component-overrides \u6743\u9650");
    if (!Array.isArray(value) || value.length > 16) fail2("PLUGIN_UI_SCHEMA_INVALID", "componentOverridePacks \u6700\u591A 16 \u9879");
    const ids = /* @__PURE__ */ new Set();
    return value.map((pack, index) => {
      const id = String(pack?.id || "");
      if (!/^[a-z][a-z0-9._-]{0,63}$/.test(id) || ids.has(id) || !pack.targets || typeof pack.targets !== "object" || Array.isArray(pack.targets)) fail2("PLUGIN_UI_SCHEMA_INVALID", `componentOverridePacks[${index}] \u65E0\u6548`);
      ids.add(id);
      const targets = {};
      for (const [targetId, raw] of Object.entries(pack.targets)) {
        const descriptor = getComponentTarget(targetId, platform);
        if (!descriptor) fail2("PLUGIN_UI_UNKNOWN_TARGET", `\u672A\u77E5\u7EC4\u4EF6\u76EE\u6807\uFF1A${targetId}`);
        if (!descriptor.available) continue;
        if (descriptor.visibilityPolicy === "protected" || descriptor.visibilityPolicy === "required") fail2(descriptor.visibilityPolicy === "protected" ? "PLUGIN_UI_PROTECTED_TARGET" : "PLUGIN_UI_REQUIRED_TARGET", `${targetId} \u4E0D\u5141\u8BB8\u9690\u85CF\u6216\u66FF\u6362`);
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail2("PLUGIN_UI_SCHEMA_INVALID", `${targetId} \u8986\u76D6\u58F0\u660E\u65E0\u6548`);
        const visibility = raw.visibility === void 0 ? "visible" : String(raw.visibility);
        if (!VISIBILITIES.has(visibility)) fail2("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${targetId}.visibility \u65E0\u6548`);
        const layout = raw.layout === void 0 ? "collapse" : String(raw.layout);
        if (!LAYOUTS.has(layout)) fail2("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${targetId}.layout \u65E0\u6548`);
        if (visibility === "replaced") fail2("PLUGIN_UI_REPLACEMENT_UNAVAILABLE", `${targetId} \u5F53\u524D\u6CA1\u6709\u53EF\u7528\u5BBF\u4E3B\u66FF\u4EE3\u89C6\u56FE`);
        targets[targetId] = { visibility, layout };
      }
      return { id, title: String(pack.title || id).slice(0, 120), description: String(pack.description || "").slice(0, 300), targets };
    });
  }
  var COMPONENT_OVERRIDE_VISIBILITIES = Object.freeze([...VISIBILITIES]);
  var COMPONENT_OVERRIDE_LAYOUTS = Object.freeze([...LAYOUTS]);

  // ../../packages/cyrene-core/src/ui-policies/native-view-policy.js
  var NODE_TYPES = /* @__PURE__ */ new Set(["Stack", "Grid", "Text", "Icon", "Badge", "Button", "Toggle", "Select", "Range", "Progress", "Divider", "List", "Table", "Notice"]);
  var ICONS = /* @__PURE__ */ new Set(["draw", "info", "warning", "settings", "filter", "history", "check", "close", "add", "remove", "refresh"]);
  var SLOTS = /* @__PURE__ */ new Set(["slot:roller.side-panel", "slot:roller.below-result", "slot:records.toolbar"]);
  var ALL_SLOTS = /* @__PURE__ */ new Set([...SLOTS, "slot:app.command-palette", "slot:roller.toolbar", "slot:card.footer", "slot:lottery.side-panel", "slot:statistics.section", "slot:settings.plugin-section"]);
  function fail3(code, message) {
    throw Object.assign(new Error(message), { code });
  }
  function safeText(value, label, max = 500) {
    const text = String(value || "");
    if (text.length > max || /[<>]/.test(text)) fail3("PLUGIN_UI_SCHEMA_INVALID", `${label} \u6587\u672C\u65E0\u6548`);
    return text;
  }
  function normalizeNativeViews(value, permissions, { platform = "web" } = {}) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:native-views")) fail3("PLUGIN_PERMISSION_DENIED", "nativeViews \u9700\u8981 ui:native-views \u6743\u9650");
    if (!Array.isArray(value) || value.length > 16) fail3("PLUGIN_UI_SCHEMA_INVALID", "nativeViews \u6700\u591A 16 \u9879");
    const ids = /* @__PURE__ */ new Set();
    return value.map((raw, index) => {
      const id = String(raw?.id || "");
      if (!/^[a-z][a-z0-9._-]{0,63}$/.test(id) || ids.has(id)) fail3("PLUGIN_UI_SCHEMA_INVALID", `nativeViews[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(id);
      const slot = String(raw.slot || "");
      if (!ALL_SLOTS.has(slot)) fail3("PLUGIN_UI_SCHEMA_INVALID", `nativeViews[${index}] slot \u65E0\u6548`);
      if (!SLOTS.has(slot)) fail3("PLUGIN_UI_SCHEMA_INVALID", `${slot} \u5F53\u524D\u4E0D\u53EF\u7528`);
      const uses = [...new Set(Array.isArray(raw.uses) ? raw.uses.map(String) : [])];
      for (const permission of uses) if (!permissions.includes(permission)) fail3("PLUGIN_PERMISSION_DENIED", `${id} \u4F7F\u7528\u4E86\u672A\u58F0\u660E\u6743\u9650\uFF1A${permission}`);
      const order = raw.order === void 0 ? 500 : Number(raw.order);
      if (!Number.isInteger(order) || order < 0 || order > 999) fail3("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${id}.order \u65E0\u6548`);
      const source = String(raw.source || "").replace(/\\/g, "/");
      if (!source || !source.toLowerCase().endsWith(".json") || source.startsWith("/") || source.includes("../") || source.includes("/..")) fail3("PLUGIN_UI_SCHEMA_INVALID", `${id}.source \u65E0\u6548`);
      return { id, title: safeText(raw.title || id, `${id}.title`), titleEn: safeText(raw.titleEn || "", `${id}.titleEn`), description: safeText(raw.description || "", `${id}.description`, 300), slot, source, uses, order, platform, available: true };
    });
  }
  var NATIVE_VIEW_NODE_TYPES = Object.freeze([...NODE_TYPES]);
  var NATIVE_VIEW_ICON_ALIASES = Object.freeze([...ICONS]);
  var NATIVE_VIEW_SLOTS = Object.freeze([...SLOTS]);

  // ../../packages/cyrene-core/src/ui-policies/result-presentation-policy.js
  var TARGETS = /* @__PURE__ */ new Set(["roller.result"]);
  var LAYOUTS2 = /* @__PURE__ */ new Set(["single", "list", "grid", "spotlight"]);
  var SIZES = /* @__PURE__ */ new Set(["small", "medium", "large"]);
  var ALIGNMENTS = /* @__PURE__ */ new Set(["start", "center", "end"]);
  function fail4(code, message) {
    throw Object.assign(new Error(message), { code });
  }
  function normalizeResultPresentations(value, permissions) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:result-presentations")) fail4("PLUGIN_PERMISSION_DENIED", "resultPresentations \u9700\u8981 ui:result-presentations \u6743\u9650");
    if (!Array.isArray(value) || value.length > 16) fail4("PLUGIN_UI_SCHEMA_INVALID", "resultPresentations \u6700\u591A 16 \u9879");
    const ids = /* @__PURE__ */ new Set();
    return value.map((raw, index) => {
      const id = String(raw?.id || "");
      if (!/^[a-z][a-z0-9._-]{0,63}$/.test(id) || ids.has(id)) fail4("PLUGIN_UI_SCHEMA_INVALID", `resultPresentations[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(id);
      const targets = [...new Set(Array.isArray(raw.targets) ? raw.targets.map(String) : [])];
      if (!targets.length || targets.some((target2) => !TARGETS.has(target2))) fail4("PLUGIN_UI_UNKNOWN_TARGET", `${id} \u7ED3\u679C\u5448\u73B0\u76EE\u6807\u4E0D\u5141\u8BB8`);
      const layout = String(raw.layout || "single");
      if (!LAYOUTS2.has(layout)) fail4("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${id}.layout \u65E0\u6548`);
      const style = raw.style && typeof raw.style === "object" && !Array.isArray(raw.style) ? raw.style : {};
      const normalizedStyle = {};
      if (style.size !== void 0) {
        if (!SIZES.has(String(style.size))) fail4("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${id}.style.size \u65E0\u6548`);
        normalizedStyle.size = String(style.size);
      }
      if (style.alignment !== void 0) {
        if (!ALIGNMENTS.has(String(style.alignment))) fail4("PLUGIN_UI_VALUE_OUT_OF_RANGE", `${id}.style.alignment \u65E0\u6548`);
        normalizedStyle.alignment = String(style.alignment);
      }
      for (const key of ["showAlgorithm", "showOperationId", "showEnglishName"]) {
        if (style[key] !== void 0) {
          if (typeof style[key] !== "boolean") fail4("PLUGIN_UI_SCHEMA_INVALID", `${id}.style.${key} \u5FC5\u987B\u662F\u5E03\u5C14\u503C`);
          normalizedStyle[key] = style[key];
        }
      }
      const unknownStyle = Object.keys(style).find((key) => !["size", "alignment", "showAlgorithm", "showOperationId", "showEnglishName"].includes(key));
      if (unknownStyle) fail4("PLUGIN_UI_PROPERTY_NOT_ALLOWED", `${id}.style.${unknownStyle} \u4E0D\u5141\u8BB8`);
      return { id, title: String(raw.title || id).slice(0, 120), titleEn: String(raw.titleEn || "").slice(0, 120), description: String(raw.description || "").slice(0, 300), targets, layout, style: normalizedStyle };
    });
  }
  var RESULT_PRESENTATION_TARGETS = Object.freeze([...TARGETS]);
  var RESULT_PRESENTATION_LAYOUTS = Object.freeze([...LAYOUTS2]);

  // ../../packages/cyrene-core/src/ui-tree-schema.js
  var UI_TREE_SCHEMA_VERSION = 1;
  var UI_TREE_LAYOUT_TYPES = Object.freeze([
    "page",
    "section",
    "card",
    "group",
    "row",
    "column",
    "form"
  ]);
  var UI_TREE_CONTROL_TYPES = Object.freeze([
    "text",
    "button",
    "text-input",
    "multiline-input",
    "toggle",
    "checkbox",
    "radio",
    "select",
    "slider",
    "number-stepper",
    "list",
    "badge",
    "icon",
    "progress"
  ]);
  var UI_TREE_NODE_TYPES = Object.freeze([...UI_TREE_LAYOUT_TYPES, ...UI_TREE_CONTROL_TYPES]);
  var UI_TREE_BINDING_SOURCES = Object.freeze([
    "settings",
    "plugin",
    "ui.state",
    "core"
  ]);
  var UI_TREE_CORE_READONLY_SOURCES = Object.freeze([
    "names",
    "records",
    "statistics",
    "balance"
  ]);
  var UI_TREE_BUTTON_VARIANTS = Object.freeze(["primary", "secondary", "subtle"]);
  var UI_TREE_TONES = Object.freeze(["neutral", "accent", "success", "warning", "danger"]);
  var UI_TREE_MAX_DEPTH = 16;
  var UI_TREE_MAX_CHILDREN = 128;
  var UI_TREE_MAX_NODES = 512;
  var UI_TREE_MAX_OPTIONS = 16;
  var UI_TREE_MAX_TEXT = 600;
  var UI_TREE_DENIED_FEATURES = Object.freeze([
    "\u4EFB\u610F DOM/VisualTree \u64CD\u4F5C",
    "\u52A8\u6001\u6CE8\u518C\u7EC4\u4EF6",
    "\u6CE8\u5165\u81EA\u5B9A\u4E49\u6837\u5F0F/CSS",
    "\u539F\u751F\u63A7\u4EF6\u76F4\u901A",
    "\u5185\u8054\u811A\u672C\u6267\u884C",
    "\u672A\u77E5\u63A7\u4EF6\u7C7B\u578B"
  ]);

  // ../../packages/cyrene-core/src/plugin-contract.js
  var PLUGIN_API_VERSION = "1.3.0";
  var PLUGIN_PERMISSIONS = /* @__PURE__ */ new Set([
    "storage:read",
    "storage:write",
    "events:draw",
    "notifications:show",
    "audio:select",
    "audio:play",
    "names:read",
    "records:read",
    "statistics:read",
    "balance:read",
    "events:lifecycle",
    "draw:execute",
    "ui:animations",
    "ui:visual-surfaces",
    "ui:appearance",
    "ui:component-styles",
    "ui:component-overrides",
    "ui:native-views",
    "ui:result-presentations",
    "ui:fonts",
    "ui:pages",
    "system:open-url",
    "system:select-file",
    "system:select-directory",
    "system:clipboard-read",
    "system:clipboard-write",
    "system:reveal-file",
    "system:execute"
  ]);
  var PLUGIN_ANIMATION_TARGETS = /* @__PURE__ */ new Set([
    "page.transition",
    "roller.finish",
    "card.deal",
    "card.flip",
    "lottery.finish",
    "global.transition"
  ]);
  var PLUGIN_LIFECYCLE_EVENTS = /* @__PURE__ */ new Set([
    "app:ready",
    "app:route-changed",
    "app:theme-changed",
    "app:resize",
    "plugin:storage-changed"
  ]);
  var PLUGIN_PLATFORM_CAPABILITIES = /* @__PURE__ */ new Set([
    "notifications:show",
    "audio:select",
    "audio:play",
    "system:open-url",
    "system:select-file",
    "system:select-directory",
    "system:clipboard-read",
    "system:clipboard-write",
    "system:reveal-file",
    "system:execute"
  ]);
  var PLUGIN_PLATFORM_IDS = /* @__PURE__ */ new Set([
    "web",
    "tauri",
    "windows",
    "macos",
    "linux",
    "android",
    "ios"
  ]);
  var PLUGIN_COMMAND_LOCATIONS = /* @__PURE__ */ new Set([
    "command-palette",
    "page-header",
    "context-menu"
  ]);
  var MAX_PLUGIN_SIZE = 32 * 1024 * 1024;
  var ID_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)+$/;
  var CONTRIBUTION_ID_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/;
  var SETTING_PATH_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/i;
  var MAX_ANIMATION_DURATION_MS = 5e3;
  var MAX_ANIMATION_DELAY_MS = 1500;
  var MAX_ANIMATION_ITERATIONS = 3;
  var ANIMATION_TIMEOUT_GRACE_MS = 500;
  var MAX_PLUGIN_ANIMATION_ACTIVE_MS = MAX_ANIMATION_DELAY_MS + MAX_ANIMATION_DURATION_MS * MAX_ANIMATION_ITERATIONS + ANIMATION_TIMEOUT_GRACE_MS;
  var ANIMATION_FRAME_PROPERTIES = /* @__PURE__ */ new Set([
    "opacity",
    "transform",
    "filter",
    "clipPath",
    "borderRadius",
    "boxShadow",
    "textShadow",
    "color",
    "background",
    "backgroundColor",
    "letterSpacing",
    "offset",
    "easing",
    "composite"
  ]);
  var GSAP_ANIMATION_PROPERTIES = /* @__PURE__ */ new Set([
    "opacity",
    "autoAlpha",
    "x",
    "y",
    "xPercent",
    "yPercent",
    "scale",
    "scaleX",
    "scaleY",
    "rotation",
    "rotate",
    "rotationX",
    "rotationY",
    "rotateX",
    "rotateY",
    "skewX",
    "skewY",
    "filter",
    "clipPath",
    "borderRadius",
    "boxShadow",
    "textShadow",
    "color",
    "background",
    "backgroundColor",
    "letterSpacing",
    "transformOrigin"
  ]);
  var UNSAFE_VISUAL_VALUE_PATTERN = /url\s*\(|image-set\s*\(|cross-fade\s*\(|paint\s*\(|(?:https?:|data:|blob:|\/\/)/i;
  var APPEARANCE_COLOR_TOKENS = /* @__PURE__ */ new Set([
    "--accent",
    "--accent-light",
    "--accent-dark",
    "--accent-hover",
    "--accent-200",
    "--accent-50",
    "--text-on-accent",
    "--bg-base",
    "--bg-card",
    "--bg-card-solid",
    "--bg-hover",
    "--bg-acrylic",
    "--bg-mica",
    "--text-primary",
    "--text-secondary",
    "--text-muted",
    "--border-default",
    "--border-subtle",
    "--border-strong"
  ]);
  var APPEARANCE_SHADOW_TOKENS = /* @__PURE__ */ new Set(["--shadow-2", "--shadow-4", "--shadow-8", "--shadow-16"]);
  var APPEARANCE_TOKENS = /* @__PURE__ */ new Set([...APPEARANCE_COLOR_TOKENS, ...APPEARANCE_SHADOW_TOKENS]);
  var ANIMATION_DIRECTIONS = /* @__PURE__ */ new Set(["normal", "reverse", "alternate", "alternate-reverse"]);
  var VISUAL_SURFACE_EVENTS = /* @__PURE__ */ new Set([
    ...PLUGIN_LIFECYCLE_EVENTS,
    "draw:item-result",
    "draw:result",
    "roller:start",
    "roller:item-result",
    "roller:result",
    "card:item-result",
    "card:result",
    "lottery:item-result",
    "lottery:result",
    "lottery:assign-result"
  ]);
  var CNRP_MAGIC = "CNRP1\n";
  function comparePluginVersions(left, right) {
    const a = String(left || "0").split(".").map((value) => Number(value) || 0);
    const b = String(right || "0").split(".").map((value) => Number(value) || 0);
    for (let index = 0; index < Math.max(a.length, b.length); index++) {
      const difference = (a[index] || 0) - (b[index] || 0);
      if (difference) return Math.sign(difference);
    }
    return 0;
  }
  function satisfiesPluginVersion(version, range = "*") {
    const wanted = String(range || "*").trim();
    if (!wanted || wanted === "*") return true;
    if (wanted.startsWith("^")) {
      const base = wanted.slice(1);
      const major = Number(base.split(".")[0]) || 0;
      return comparePluginVersions(version, base) >= 0 && Number(String(version).split(".")[0]) === major;
    }
    if (wanted.startsWith("~")) {
      const base = wanted.slice(1);
      const [major = 0, minor = 0] = base.split(".").map(Number);
      const [actualMajor = 0, actualMinor = 0] = String(version).split(".").map(Number);
      return comparePluginVersions(version, base) >= 0 && actualMajor === major && actualMinor === minor;
    }
    if (wanted.startsWith(">=")) return comparePluginVersions(version, wanted.slice(2).trim()) >= 0;
    if (wanted.startsWith(">")) return comparePluginVersions(version, wanted.slice(1).trim()) > 0;
    if (wanted.startsWith("<=")) return comparePluginVersions(version, wanted.slice(2).trim()) <= 0;
    if (wanted.startsWith("<")) return comparePluginVersions(version, wanted.slice(1).trim()) < 0;
    return comparePluginVersions(version, wanted) === 0;
  }
  function validatePath(path) {
    const normalized = String(path || "").replace(/\\/g, "/");
    if (!normalized || normalized.includes("\0") || normalized.startsWith("/") || normalized.includes("../") || normalized.includes("/..")) {
      throw new Error(`\u63D2\u4EF6\u5305\u542B\u4E0D\u5B89\u5168\u8DEF\u5F84\uFF1A${path}`);
    }
    return normalized;
  }
  function normalizePlatforms(value, label) {
    if (value === void 0) return [];
    if (!Array.isArray(value)) throw new Error(`${label}\u5FC5\u987B\u662F\u5E73\u53F0\u6570\u7EC4`);
    const platforms = [...new Set(value.map((item) => String(item).toLowerCase()))];
    const unknown = platforms.find((item) => !PLUGIN_PLATFORM_IDS.has(item));
    if (unknown) throw new Error(`${label}\u5305\u542B\u672A\u77E5\u5E73\u53F0\uFF1A${unknown}`);
    return platforms;
  }
  function normalizePlatformEntries(value, label) {
    if (value === void 0) return {};
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}\u65E0\u6548`);
    const result = {};
    for (const [platform, path] of Object.entries(value)) {
      if (!PLUGIN_PLATFORM_IDS.has(platform)) throw new Error(`${label}\u5305\u542B\u672A\u77E5\u5E73\u53F0\uFF1A${platform}`);
      result[platform] = validatePath(path);
    }
    return result;
  }
  function normalizeCapabilities(value, permissions) {
    if (value === void 0) return {};
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("capabilities \u5FC5\u987B\u662F\u5BF9\u8C61");
    const result = {};
    for (const [id, raw] of Object.entries(value)) {
      if (!PLUGIN_PLATFORM_CAPABILITIES.has(id)) throw new Error(`\u672A\u77E5\u5E73\u53F0\u80FD\u529B\uFF1A${id}`);
      const declaration = raw === true ? { required: true } : raw === false ? { required: false } : raw;
      if (!declaration || typeof declaration !== "object" || Array.isArray(declaration)) throw new Error(`\u5E73\u53F0\u80FD\u529B\u58F0\u660E\u65E0\u6548\uFF1A${id}`);
      if (!permissions.includes(id)) throw new Error(`\u5E73\u53F0\u80FD\u529B ${id} \u5FC5\u987B\u540C\u65F6\u52A0\u5165 permissions`);
      result[id] = {
        required: !!declaration.required,
        platforms: normalizePlatforms(declaration.platforms, `${id}.platforms`)
      };
    }
    const undeclared = permissions.find((permission) => permission.startsWith("system:") && !result[permission]);
    if (undeclared) throw new Error(`\u7CFB\u7EDF\u6743\u9650 ${undeclared} \u5FC5\u987B\u5728 capabilities \u4E2D\u58F0\u660E\u662F\u5426\u4E3A\u5FC5\u9700\u80FD\u529B`);
    return result;
  }
  function normalizeSystemOperations(value, permissions) {
    if (value === void 0 || Array.isArray(value) && value.length === 0) return [];
    if (!permissions.includes("system:execute")) throw new Error("systemOperations \u9700\u8981 system:execute \u6743\u9650");
    if (!Array.isArray(value)) throw new Error("systemOperations \u5FC5\u987B\u662F\u6570\u7EC4");
    const ids = /* @__PURE__ */ new Set();
    return value.map((operation) => {
      if (!operation || typeof operation !== "object" || !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(operation.id || "") || ids.has(operation.id)) {
        throw new Error(`\u7CFB\u7EDF\u64CD\u4F5C ID \u65E0\u6548\u6216\u91CD\u590D\uFF1A${operation?.id || "\u672A\u77E5"}`);
      }
      ids.add(operation.id);
      if (!operation.label || String(operation.label).length > 100) throw new Error(`\u7CFB\u7EDF\u64CD\u4F5C ${operation.id} \u7F3A\u5C11\u7B80\u77ED\u8BF4\u660E`);
      const platforms = normalizePlatforms(operation.platforms, `${operation.id}.platforms`);
      if (!platforms.length || platforms.includes("web")) throw new Error(`\u7CFB\u7EDF\u64CD\u4F5C ${operation.id} \u5FC5\u987B\u58F0\u660E\u975E Web \u5E73\u53F0`);
      const command = operation.command;
      if (!command || typeof command !== "object") throw new Error(`\u7CFB\u7EDF\u64CD\u4F5C ${operation.id} \u7F3A\u5C11\u56FA\u5B9A\u547D\u4EE4`);
      const program = String(command.program || "");
      if (!/^[a-zA-Z0-9_.-]{1,128}$/.test(program)) throw new Error(`\u7CFB\u7EDF\u64CD\u4F5C ${operation.id} \u7684\u7A0B\u5E8F\u540D\u65E0\u6548`);
      const args = Array.isArray(command.args) ? command.args.map(String) : [];
      if (args.length > 32 || args.some((argument) => argument.includes("\0") || argument.length > 2048)) {
        throw new Error(`\u7CFB\u7EDF\u64CD\u4F5C ${operation.id} \u7684\u56FA\u5B9A\u53C2\u6570\u65E0\u6548`);
      }
      return {
        id: operation.id,
        label: String(operation.label),
        platforms,
        command: { program, args },
        timeoutMs: Math.max(1e3, Math.min(3e4, Number(operation.timeoutMs) || 1e4))
      };
    });
  }
  function normalizeAnimationOptions(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}.options \u65E0\u6548`);
    const duration = Number(value.duration);
    const delay = Number(value.delay || 0);
    const iterations = Number(value.iterations || 1);
    const easing = String(value.easing || "ease");
    const direction = String(value.direction || "normal");
    if (!Number.isFinite(duration) || duration < 80 || duration > MAX_ANIMATION_DURATION_MS) throw new Error(`${label}.options.duration \u5FC5\u987B\u5728 80-${MAX_ANIMATION_DURATION_MS}ms`);
    if (!Number.isFinite(delay) || delay < 0 || delay > MAX_ANIMATION_DELAY_MS) throw new Error(`${label}.options.delay \u5FC5\u987B\u5728 0-${MAX_ANIMATION_DELAY_MS}ms`);
    if (!Number.isFinite(iterations) || iterations < 1 || iterations > MAX_ANIMATION_ITERATIONS) throw new Error(`${label}.options.iterations \u5FC5\u987B\u5728 1-${MAX_ANIMATION_ITERATIONS}`);
    if (!/^[a-z0-9().,%\s+\-*/]+$/i.test(easing) || easing.length > 160) throw new Error(`${label}.options.easing \u65E0\u6548`);
    if (!ANIMATION_DIRECTIONS.has(direction)) throw new Error(`${label}.options.direction \u65E0\u6548`);
    return { duration, delay, iterations, easing, direction, fill: "both" };
  }
  function normalizeSafeAnimationValue(raw, label) {
    if (typeof raw !== "string" && typeof raw !== "number" && typeof raw !== "boolean") throw new Error(label + " \u65E0\u6548");
    if (typeof raw === "boolean") return raw;
    const serialized = String(raw);
    if (serialized.length > 600 || /[{};<>\\]/.test(serialized) || UNSAFE_VISUAL_VALUE_PATTERN.test(serialized)) {
      throw new Error(label + " \u8FC7\u957F\u6216\u5305\u542B\u4E0D\u5B89\u5168\u5185\u5BB9");
    }
    return raw;
  }
  function normalizeGsapVars(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(label + " \u65E0\u6548");
    const normalized = {};
    for (const [property, raw] of Object.entries(value)) {
      if (!GSAP_ANIMATION_PROPERTIES.has(property)) throw new Error(label + " \u4E0D\u5141\u8BB8\u5C5E\u6027 " + property);
      normalized[property] = normalizeSafeAnimationValue(raw, label + "." + property);
    }
    if (!Object.keys(normalized).length) throw new Error(label + " \u81F3\u5C11\u9700\u8981\u4E00\u4E2A\u52A8\u753B\u5C5E\u6027");
    return normalized;
  }
  function normalizeGsapOptions(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(label + ".options \u65E0\u6548");
    const duration = Number(value.duration);
    const delay = Number(value.delay || 0);
    const repeat = Number(value.repeat || 0);
    const ease = String(value.ease || value.easing || "power3.out");
    if (!Number.isFinite(duration) || duration < 80 || duration > MAX_ANIMATION_DURATION_MS) throw new Error(label + ".options.duration \u5FC5\u987B\u5728 80-" + MAX_ANIMATION_DURATION_MS + "ms");
    if (!Number.isFinite(delay) || delay < 0 || delay > MAX_ANIMATION_DELAY_MS) throw new Error(label + ".options.delay \u5FC5\u987B\u5728 0-" + MAX_ANIMATION_DELAY_MS + "ms");
    if (!Number.isInteger(repeat) || repeat < 0 || repeat >= MAX_ANIMATION_ITERATIONS) throw new Error(label + ".options.repeat \u5FC5\u987B\u5728 0-" + (MAX_ANIMATION_ITERATIONS - 1));
    if (!/^[a-z0-9().,%\s+\-*/]+$/i.test(ease) || ease.length > 160) throw new Error(label + ".options.ease \u65E0\u6548");
    return { duration, delay, repeat, ease, yoyo: value.yoyo === true };
  }
  function normalizeAnimationKeyframes(value, label) {
    if (!Array.isArray(value) || value.length < 2 || value.length > 32) throw new Error(`${label}.keyframes \u5FC5\u987B\u5305\u542B 2-32 \u5E27`);
    let previousOffset = -1;
    return value.map((frame, index) => {
      if (!frame || typeof frame !== "object" || Array.isArray(frame)) throw new Error(`${label}.keyframes[${index}] \u65E0\u6548`);
      const normalized = {};
      for (const [property, raw] of Object.entries(frame)) {
        if (!ANIMATION_FRAME_PROPERTIES.has(property)) throw new Error(`${label}.keyframes[${index}] \u4E0D\u5141\u8BB8\u5C5E\u6027 ${property}`);
        if (property === "offset") {
          const offset = Number(raw);
          if (!Number.isFinite(offset) || offset < 0 || offset > 1 || offset < previousOffset) throw new Error(`${label}.keyframes[${index}].offset \u65E0\u6548`);
          previousOffset = offset;
          normalized.offset = offset;
          continue;
        }
        if (property === "composite") {
          if (!["replace", "add", "accumulate"].includes(raw)) throw new Error(`${label}.keyframes[${index}].composite \u65E0\u6548`);
          normalized.composite = raw;
          continue;
        }
        if (typeof raw !== "string" && typeof raw !== "number") throw new Error(`${label}.keyframes[${index}].${property} \u65E0\u6548`);
        const serialized = String(raw);
        if (serialized.length > 600 || /[{};<>\\]/.test(serialized) || UNSAFE_VISUAL_VALUE_PATTERN.test(serialized)) {
          throw new Error(`${label}.keyframes[${index}].${property} \u8FC7\u957F\u6216\u5305\u542B\u4E0D\u5B89\u5168\u5185\u5BB9`);
        }
        normalized[property] = raw;
      }
      if (!Object.keys(normalized).some((property) => !["offset", "easing", "composite"].includes(property))) {
        throw new Error(`${label}.keyframes[${index}] \u6CA1\u6709\u53EF\u52A8\u753B\u5C5E\u6027`);
      }
      return normalized;
    });
  }
  function normalizeAnimationDefinition(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} \u65E0\u6548`);
    if (value.gsap !== void 0) {
      if (!value.gsap || typeof value.gsap !== "object" || Array.isArray(value.gsap)) throw new Error(`${label}.gsap \u65E0\u6548`);
      return {
        engine: "gsap",
        gsap: {
          from: normalizeGsapVars(value.gsap.from, `${label}.gsap.from`),
          to: normalizeGsapVars(value.gsap.to, `${label}.gsap.to`)
        },
        options: normalizeGsapOptions(value.gsap.options || value.options || {}, label)
      };
    }
    return {
      engine: "waapi",
      keyframes: normalizeAnimationKeyframes(value.keyframes, label),
      options: normalizeAnimationOptions(value.options || {}, label)
    };
  }
  function normalizeAnimationPack(value, declaration = {}) {
    const label = `\u52A8\u753B\u5305 ${declaration.id || "unknown"}`;
    if (!value || typeof value !== "object" || Array.isArray(value) || value.schemaVersion !== 1) throw new Error(`${label} schemaVersion \u5FC5\u987B\u4E3A 1`);
    if (!Array.isArray(value.presets) || !value.presets.length || value.presets.length > 128) throw new Error(`${label}.presets \u5FC5\u987B\u5305\u542B 1-128 \u9879`);
    const ids = /* @__PURE__ */ new Set();
    const defaults = /* @__PURE__ */ new Set();
    const presets = value.presets.map((preset, index) => {
      if (!preset || typeof preset !== "object" || !CONTRIBUTION_ID_PATTERN.test(preset.id || "") || ids.has(preset.id)) {
        throw new Error(`${label}.presets[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      }
      ids.add(preset.id);
      if (!PLUGIN_ANIMATION_TARGETS.has(preset.target)) throw new Error(`${label}.presets[${index}] target \u65E0\u6548\uFF1A${preset.target}`);
      if (!preset.label || String(preset.label).length > 120) throw new Error(`${label}.presets[${index}] \u7F3A\u5C11 label`);
      const variants = {};
      for (const [variant, definition] of Object.entries(preset.variants || {})) {
        if (!CONTRIBUTION_ID_PATTERN.test(variant)) throw new Error(`${label}.presets[${index}] variant \u65E0\u6548\uFF1A${variant}`);
        variants[variant] = normalizeAnimationDefinition(definition, `${label}.${preset.id}.${variant}`);
      }
      const animation = preset.animation ? normalizeAnimationDefinition(preset.animation, `${label}.${preset.id}.animation`) : null;
      if (!animation && !Object.keys(variants).length) throw new Error(`${label}.presets[${index}] \u7F3A\u5C11 animation \u6216 variants`);
      const isDefault = !!preset.default;
      if (isDefault && defaults.has(preset.target)) throw new Error(`${label} \u4E2D ${preset.target} \u53EA\u80FD\u6709\u4E00\u4E2A\u9ED8\u8BA4\u52A8\u753B`);
      if (isDefault) defaults.add(preset.target);
      return {
        id: String(preset.id),
        target: preset.target,
        label: String(preset.label),
        description: String(preset.description || "").slice(0, 300),
        tags: Array.isArray(preset.tags) ? preset.tags.map(String).slice(0, 12) : [],
        default: isDefault,
        animation,
        variants
      };
    });
    return {
      id: String(declaration.id || value.id || ""),
      title: String(declaration.title || value.title || declaration.id || ""),
      description: String(declaration.description || value.description || "").slice(0, 500),
      source: String(declaration.source || ""),
      schemaVersion: 1,
      presets
    };
  }
  function normalizeAnimationPacks(value, permissions) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:animations")) throw new Error("animationPacks \u9700\u8981 ui:animations \u6743\u9650");
    if (!Array.isArray(value) || value.length > 16) throw new Error("animationPacks \u5FC5\u987B\u662F\u6700\u591A 16 \u9879\u7684\u6570\u7EC4");
    const ids = /* @__PURE__ */ new Set();
    return value.map((pack, index) => {
      if (!pack || typeof pack !== "object" || !CONTRIBUTION_ID_PATTERN.test(pack.id || "") || ids.has(pack.id)) throw new Error(`animationPacks[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(pack.id);
      if (!pack.title || String(pack.title).length > 120) throw new Error(`animationPacks[${index}] \u7F3A\u5C11 title`);
      return { id: String(pack.id), title: String(pack.title), description: String(pack.description || "").slice(0, 300), source: validatePath(pack.source) };
    });
  }
  function normalizeAppearanceColor(value, label) {
    const source = String(value || "").trim();
    const hex = source.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
    if (hex) return source.toLowerCase();
    const rgb2 = source.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i);
    if (!rgb2 || rgb2.slice(1, 4).some((channel) => Number(channel) > 255)) throw new Error(`${label} \u5FC5\u987B\u662F\u5341\u516D\u8FDB\u5236\u6216 rgb/rgba \u989C\u8272`);
    if (source.toLowerCase().startsWith("rgba") && rgb2[4] === void 0) throw new Error(`${label} \u7684 rgba \u7F3A\u5C11\u900F\u660E\u5EA6`);
    return source.replace(/\s+/g, " ");
  }
  function normalizeAppearanceShadow(value, label) {
    const source = String(value || "").trim();
    if (source === "none") return source;
    if (!source || source.length > 320 || UNSAFE_VISUAL_VALUE_PATTERN.test(source) || /[{};<>\\]/.test(source) || !/^[#(),.%\sa-z0-9+\-]+$/i.test(source)) {
      throw new Error(`${label} \u9634\u5F71\u503C\u65E0\u6548`);
    }
    return source.replace(/\s+/g, " ");
  }
  function opaqueRgb(value) {
    const source = String(value || "").trim();
    const hex = source.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
      const raw = hex[1].length === 3 ? hex[1].split("").map((character) => character + character).join("") : hex[1];
      return [0, 2, 4].map((index) => parseInt(raw.slice(index, index + 2), 16));
    }
    const rgb2 = source.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
    return rgb2 ? rgb2.slice(1).map(Number) : null;
  }
  function contrastRatio2(foreground, background) {
    const channel = (value) => {
      const normalized = value / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (color) => color.map(channel).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const first = luminance(foreground);
    const second = luminance(background);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  }
  function normalizeAppearanceTokens(value, label) {
    if (value === void 0) return {};
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} \u5FC5\u987B\u662F Token \u5BF9\u8C61`);
    const normalized = {};
    for (const [token, raw] of Object.entries(value)) {
      if (!APPEARANCE_TOKENS.has(token)) throw new Error(`${label} \u4E0D\u5141\u8BB8 Token ${token}`);
      normalized[token] = APPEARANCE_SHADOW_TOKENS.has(token) ? normalizeAppearanceShadow(raw, `${label}.${token}`) : normalizeAppearanceColor(raw, `${label}.${token}`);
    }
    const pairs = [["--text-primary", "--bg-base"], ["--text-on-accent", "--accent"]];
    for (const [foregroundToken, backgroundToken] of pairs) {
      const foreground = opaqueRgb(normalized[foregroundToken]);
      const background = opaqueRgb(normalized[backgroundToken]);
      if (foreground && background && contrastRatio2(foreground, background) < 4.5) {
        throw new Error(`${label} \u7684 ${foregroundToken} \u4E0E ${backgroundToken} \u5BF9\u6BD4\u5EA6\u4F4E\u4E8E 4.5:1`);
      }
    }
    return normalized;
  }
  function normalizeAppearancePacks(value, permissions) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:appearance")) throw new Error("appearancePacks \u9700\u8981 ui:appearance \u6743\u9650");
    if (!Array.isArray(value) || value.length > 16) throw new Error("appearancePacks \u5FC5\u987B\u662F\u6700\u591A 16 \u9879\u7684\u6570\u7EC4");
    const ids = /* @__PURE__ */ new Set();
    return value.map((pack, index) => {
      if (!pack || typeof pack !== "object" || !CONTRIBUTION_ID_PATTERN.test(pack.id || "") || ids.has(pack.id)) {
        throw new Error(`appearancePacks[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      }
      ids.add(pack.id);
      const title = String(pack.title || "").trim();
      if (!title || title.length > 120) throw new Error(`appearancePacks[${index}] \u7F3A\u5C11 title \u6216\u8FC7\u957F`);
      const titleEn = String(pack.titleEn || "").trim();
      if (titleEn.length > 120) throw new Error(`appearancePacks[${index}].titleEn \u8FC7\u957F`);
      const light = normalizeAppearanceTokens(pack.light, `appearancePacks[${index}].light`);
      const dark = normalizeAppearanceTokens(pack.dark, `appearancePacks[${index}].dark`);
      if (!Object.keys(light).length && !Object.keys(dark).length) throw new Error(`appearancePacks[${index}] \u81F3\u5C11\u9700\u8981\u4E00\u4E2A\u6D45\u8272\u6216\u6DF1\u8272 Token`);
      return {
        id: String(pack.id),
        title,
        titleEn,
        description: String(pack.description || "").slice(0, 300),
        base: pack.base === "fluent" ? "fluent" : "peach",
        light,
        dark
      };
    });
  }
  function normalizeVisualSurfaces(value, permissions) {
    if (value === void 0) return [];
    if (!permissions.includes("ui:visual-surfaces")) throw new Error("visualSurfaces \u9700\u8981 ui:visual-surfaces \u6743\u9650");
    if (!Array.isArray(value) || value.length > 8) throw new Error("visualSurfaces \u5FC5\u987B\u662F\u6700\u591A 8 \u9879\u7684\u6570\u7EC4");
    const ids = /* @__PURE__ */ new Set();
    return value.map((surface, index) => {
      if (!surface || typeof surface !== "object" || !CONTRIBUTION_ID_PATTERN.test(surface.id || "") || ids.has(surface.id)) throw new Error(`visualSurfaces[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(surface.id);
      const platformEntries = normalizePlatformEntries(surface.platformEntries, `visualSurfaces[${index}].platformEntries`);
      const entry = surface.entry ? validatePath(surface.entry) : "";
      if (!entry && !Object.keys(platformEntries).length) throw new Error(`visualSurfaces[${index}] \u7F3A\u5C11 entry`);
      if (surface.placement && surface.placement !== "background") throw new Error(`visualSurfaces[${index}].placement \u4EC5\u652F\u6301 background`);
      const events = [...new Set(Array.isArray(surface.events) ? surface.events.map(String) : [])];
      const unknownEvent = events.find((event) => !VISUAL_SURFACE_EVENTS.has(event));
      if (unknownEvent) throw new Error(`visualSurfaces[${index}] \u5305\u542B\u672A\u77E5\u4E8B\u4EF6\uFF1A${unknownEvent}`);
      return {
        id: String(surface.id),
        title: String(surface.title || surface.id),
        entry,
        platformEntries,
        placement: "background",
        events,
        defaultEnabled: surface.defaultEnabled !== false
      };
    });
  }
  function normalizeDependencies(value, pluginId) {
    if (value === void 0) return [];
    if (!Array.isArray(value)) throw new Error("dependencies \u5FC5\u987B\u662F\u6570\u7EC4");
    const ids = /* @__PURE__ */ new Set();
    return value.map((dependency, index) => {
      if (!dependency || typeof dependency !== "object" || Array.isArray(dependency)) throw new Error(`dependencies[${index}] \u65E0\u6548`);
      const id = String(dependency.id || "");
      if (!ID_PATTERN.test(id) || id === pluginId || ids.has(id)) throw new Error(`dependencies[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(id);
      const range = String(dependency.range || dependency.version || "*");
      if (!range || range.length > 80 || /[{};<>]/.test(range)) throw new Error(`dependencies[${index}].range \u65E0\u6548`);
      return { id, range, dataAccess: dependency.dataAccess === true };
    });
  }
  function normalizeNativePage(value, label) {
    if (value === void 0 || value === null) return null;
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} \u65E0\u6548`);
    if (value.type !== "settings") throw new Error(`${label}.type \u4EC5\u652F\u6301 settings`);
    if (!Array.isArray(value.controls) || value.controls.length > 64) throw new Error(`${label}.controls \u65E0\u6548`);
    const ids = /* @__PURE__ */ new Set();
    const controls = value.controls.map((control, index) => {
      if (!control || typeof control !== "object" || !CONTRIBUTION_ID_PATTERN.test(control.id || "") || ids.has(control.id)) {
        throw new Error(`${label}.controls[${index}] \u7684 ID \u65E0\u6548\u6216\u91CD\u590D`);
      }
      ids.add(control.id);
      const type = String(control.type || "");
      if (!["toggle", "range", "select", "audio", "animation-select"].includes(type)) throw new Error(`${label}.controls[${index}] \u7C7B\u578B\u4E0D\u53D7\u652F\u6301`);
      if (!control.label || String(control.label).length > 120) throw new Error(`${label}.controls[${index}] \u7F3A\u5C11 label`);
      if (type !== "animation-select" && !SETTING_PATH_PATTERN.test(control.path || "")) throw new Error(`${label}.controls[${index}] path \u65E0\u6548`);
      if (type === "animation-select" && !PLUGIN_ANIMATION_TARGETS.has(control.target)) throw new Error(`${label}.controls[${index}] target \u65E0\u6548`);
      if (type === "animation-select" && control.packId && !CONTRIBUTION_ID_PATTERN.test(control.packId)) throw new Error(`${label}.controls[${index}] packId \u65E0\u6548`);
      if (type === "select" && (!Array.isArray(control.options) || !control.options.length || control.options.length > 32)) {
        throw new Error(`${label}.controls[${index}] options \u65E0\u6548`);
      }
      if (type === "range") {
        const min = Number(control.min);
        const max = Number(control.max);
        if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) throw new Error(`${label}.controls[${index}] \u8303\u56F4\u65E0\u6548`);
      }
      return {
        id: String(control.id),
        type,
        label: control.label,
        description: control.description || "",
        path: type === "animation-select" ? "" : String(control.path),
        target: type === "animation-select" ? control.target : void 0,
        packId: type === "animation-select" ? String(control.packId || "") : void 0,
        accept: type === "audio" ? String(control.accept || "audio/*") : void 0,
        min: type === "range" ? Number(control.min) : void 0,
        max: type === "range" ? Number(control.max) : void 0,
        step: type === "range" ? Number(control.step || 0.01) : void 0,
        options: type === "select" ? control.options.map((option) => ({ value: String(option.value), label: option.label })) : void 0,
        default: control.default
      };
    });
    const settingsKey = String(value.settingsKey || "settings");
    if (!SETTING_PATH_PATTERN.test(settingsKey)) throw new Error(`${label}.settingsKey \u65E0\u6548`);
    return { type: "settings", settingsKey, controls };
  }
  function normalizePages(value) {
    if (value === void 0) return [];
    if (!Array.isArray(value) || value.length > 32) throw new Error("pages \u5FC5\u987B\u662F\u6700\u591A 32 \u9879\u7684\u6570\u7EC4");
    const ids = /* @__PURE__ */ new Set();
    return value.map((rawPage, index) => {
      if (!rawPage || typeof rawPage !== "object" || Array.isArray(rawPage)) throw new Error(`pages[${index}] \u65E0\u6548`);
      const id = String(rawPage.id || "");
      if (!CONTRIBUTION_ID_PATTERN.test(id) || ids.has(id)) throw new Error(`pages[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(id);
      const title = String(rawPage.title || "").trim();
      if (!title || title.length > 120) throw new Error(`pages[${index}] \u7F3A\u5C11 title \u6216\u8FC7\u957F`);
      if (rawPage.location !== void 0 && !["plugins", "dock"].includes(rawPage.location)) throw new Error(`pages[${index}].location \u65E0\u6548`);
      const platformEntries = normalizePlatformEntries(rawPage.platformEntries, `pages[${index}].platformEntries`);
      const entry = rawPage.entry ? validatePath(rawPage.entry) : "";
      const native = normalizeNativePage(rawPage.native, `pages[${index}].native`);
      if (!entry && !Object.keys(platformEntries).length && !native) throw new Error(`pages[${index}] \u7F3A\u5C11\u53EF\u7528\u7684\u9875\u9762\u5165\u53E3`);
      const order = rawPage.order === void 0 ? 500 : Number(rawPage.order);
      if (!Number.isInteger(order) || order < 0 || order > 999) throw new Error(`pages[${index}].order \u5FC5\u987B\u662F 0-999 \u7684\u6574\u6570`);
      const icon = String(rawPage.icon || "apps-24-regular");
      if (!/^[a-z0-9][a-z0-9:_-]{0,99}$/i.test(icon)) throw new Error(`pages[${index}].icon \u65E0\u6548`);
      const titleEn = String(rawPage.titleEn || "").trim();
      if (titleEn.length > 120) throw new Error(`pages[${index}].titleEn \u8FC7\u957F`);
      return {
        id,
        title,
        titleEn,
        icon,
        entry,
        platformEntries,
        native,
        location: rawPage.location === "dock" ? "dock" : "plugins",
        order,
        description: String(rawPage.description || "").slice(0, 300)
      };
    });
  }
  function normalizeCommands(value) {
    if (value === void 0) return [];
    if (!Array.isArray(value) || value.length > 64) throw new Error("commands \u5FC5\u987B\u662F\u6700\u591A 64 \u9879\u7684\u6570\u7EC4");
    const ids = /* @__PURE__ */ new Set();
    return value.map((rawCommand, index) => {
      if (!rawCommand || typeof rawCommand !== "object" || Array.isArray(rawCommand)) {
        throw new Error(`commands[${index}] \u65E0\u6548`);
      }
      const id = String(rawCommand.id || "");
      if (!CONTRIBUTION_ID_PATTERN.test(id) || ids.has(id)) throw new Error(`commands[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(id);
      const title = String(rawCommand.title || "").trim();
      if (!title || title.length > 120) throw new Error(`commands[${index}] \u7F3A\u5C11 title \u6216\u8FC7\u957F`);
      const titleEn = String(rawCommand.titleEn || "").trim();
      if (titleEn.length > 120) throw new Error(`commands[${index}].titleEn \u8FC7\u957F`);
      const locations = [...new Set(Array.isArray(rawCommand.locations) ? rawCommand.locations.map(String) : ["command-palette"])];
      const unknownLocation = locations.find((location) => !PLUGIN_COMMAND_LOCATIONS.has(location));
      if (unknownLocation) throw new Error(`commands[${index}] \u5305\u542B\u672A\u77E5 location\uFF1A${unknownLocation}`);
      const icon = String(rawCommand.icon || "apps-24-regular");
      if (!/^[a-z0-9][a-z0-9:_-]{0,99}$/i.test(icon)) throw new Error(`commands[${index}].icon \u65E0\u6548`);
      const order = rawCommand.order === void 0 ? 500 : Number(rawCommand.order);
      if (!Number.isInteger(order) || order < 0 || order > 999) throw new Error(`commands[${index}].order \u5FC5\u987B\u662F 0-999 \u7684\u6574\u6570`);
      return {
        id,
        title,
        titleEn,
        description: String(rawCommand.description || "").slice(0, 300),
        icon,
        locations,
        order
      };
    });
  }
  function normalizeUiSection(value, permissions, sdkVersion) {
    if (sdkVersion === 1) {
      if (value !== void 0) throw new Error("sdkVersion 1 \u63D2\u4EF6\u4E0D\u5141\u8BB8\u58F0\u660E ui \u6BB5");
      return void 0;
    }
    if (!permissions.includes("ui:pages")) throw new Error("ui \u6BB5\u9700\u8981 ui:pages \u6743\u9650");
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("ui \u6BB5\u65E0\u6548");
    if (value.schemaVersion !== UI_TREE_SCHEMA_VERSION) throw new Error(`ui.schemaVersion \u5FC5\u987B\u4E3A ${UI_TREE_SCHEMA_VERSION}`);
    if (!Array.isArray(value.pages) || !value.pages.length || value.pages.length > 8) throw new Error("ui.pages \u5FC5\u987B\u5305\u542B 1-8 \u9879");
    const ids = /* @__PURE__ */ new Set();
    const pages = value.pages.map((rawPage, index) => {
      if (!rawPage || typeof rawPage !== "object" || Array.isArray(rawPage)) throw new Error(`ui.pages[${index}] \u65E0\u6548`);
      const id = String(rawPage.id || "");
      if (!CONTRIBUTION_ID_PATTERN.test(id) || ids.has(id)) throw new Error(`ui.pages[${index}] ID \u65E0\u6548\u6216\u91CD\u590D`);
      ids.add(id);
      const title = String(rawPage.title || "").trim();
      if (!title || title.length > 120) throw new Error(`ui.pages[${index}] \u7F3A\u5C11 title \u6216\u8FC7\u957F`);
      const titleEn = String(rawPage.titleEn || "").trim();
      if (titleEn.length > 120) throw new Error(`ui.pages[${index}].titleEn \u8FC7\u957F`);
      const icon = String(rawPage.icon || "apps-24-regular");
      if (!/^[a-z0-9][a-z0-9:_-]{0,99}$/i.test(icon)) throw new Error(`ui.pages[${index}].icon \u65E0\u6548`);
      const order = rawPage.order === void 0 ? 500 : Number(rawPage.order);
      if (!Number.isInteger(order) || order < 0 || order > 999) throw new Error(`ui.pages[${index}].order \u5FC5\u987B\u662F 0-999 \u7684\u6574\u6570`);
      if (rawPage.location !== void 0 && !["plugins", "dock"].includes(rawPage.location)) throw new Error(`ui.pages[${index}].location \u65E0\u6548`);
      const source = validatePath(rawPage.source);
      if (!source) throw new Error(`ui.pages[${index}] \u7F3A\u5C11 source`);
      return { id, title, titleEn, icon, source, location: rawPage.location === "dock" ? "dock" : "plugins", order, description: String(rawPage.description || "").slice(0, 300) };
    });
    return { schemaVersion: UI_TREE_SCHEMA_VERSION, pages };
  }
  function normalizePluginManifest(raw) {
    if (!raw || typeof raw !== "object") throw new Error("manifest.json \u65E0\u6548");
    const manifest = JSON.parse(JSON.stringify(raw));
    if (manifest.schemaVersion !== 1) throw new Error("\u4E0D\u652F\u6301\u7684\u63D2\u4EF6\u6E05\u5355\u7248\u672C");
    if (!ID_PATTERN.test(manifest.id || "")) throw new Error("\u63D2\u4EF6 ID \u65E0\u6548\uFF0C\u5EFA\u8BAE\u4F7F\u7528\u53CD\u5411\u57DF\u540D\u683C\u5F0F");
    if (!manifest.name || !manifest.version || !manifest.author) throw new Error("\u63D2\u4EF6\u540D\u79F0\u3001\u7248\u672C\u6216\u5F00\u53D1\u8005\u7F3A\u5931");
    if (!manifest.engine || comparePluginVersions(PLUGIN_API_VERSION, manifest.engine.min || "0") < 0) {
      throw new Error(`\u63D2\u4EF6\u9700\u8981 API ${manifest.engine?.min || "\u672A\u77E5"}\uFF0C\u5F53\u524D\u4E3A ${PLUGIN_API_VERSION}`);
    }
    const sdkVersion = manifest.sdkVersion === void 0 ? 1 : manifest.sdkVersion;
    if (![1, 2].includes(sdkVersion)) throw new Error("sdkVersion \u5FC5\u987B\u4E3A 1 \u6216 2");
    manifest.sdkVersion = sdkVersion;
    manifest.permissions = [...new Set(manifest.permissions || [])];
    const unknownPermission = manifest.permissions.find((permission) => !PLUGIN_PERMISSIONS.has(permission));
    if (unknownPermission) throw new Error(`\u672A\u77E5\u63D2\u4EF6\u6743\u9650\uFF1A${unknownPermission}`);
    manifest.contributes = manifest.contributes && typeof manifest.contributes === "object" ? manifest.contributes : {};
    manifest.contributes.pages = normalizePages(manifest.contributes.pages);
    manifest.contributes.commands = normalizeCommands(manifest.contributes.commands);
    manifest.contributes.animationPacks = normalizeAnimationPacks(manifest.contributes.animationPacks, manifest.permissions);
    manifest.contributes.visualSurfaces = normalizeVisualSurfaces(manifest.contributes.visualSurfaces, manifest.permissions);
    manifest.contributes.appearancePacks = normalizeAppearancePacks(manifest.contributes.appearancePacks, manifest.permissions);
    manifest.contributes.componentStylePacks = normalizeComponentStylePacks(manifest.contributes.componentStylePacks, manifest.permissions, { pluginId: manifest.id });
    manifest.contributes.fonts = normalizeFonts(manifest.contributes.fonts, manifest.permissions, { pluginId: manifest.id });
    manifest.contributes.componentOverridePacks = normalizeComponentOverridePacks(manifest.contributes.componentOverridePacks, manifest.permissions);
    manifest.contributes.nativeViews = normalizeNativeViews(manifest.contributes.nativeViews, manifest.permissions);
    manifest.contributes.resultPresentations = normalizeResultPresentations(manifest.contributes.resultPresentations, manifest.permissions);
    manifest.supportedPlatforms = normalizePlatforms(manifest.supportedPlatforms, "supportedPlatforms");
    manifest.platformEntries = normalizePlatformEntries(manifest.platformEntries, "platformEntries");
    manifest.capabilities = normalizeCapabilities(manifest.capabilities, manifest.permissions);
    manifest.systemOperations = normalizeSystemOperations(manifest.systemOperations, manifest.permissions);
    manifest.dependencies = normalizeDependencies(manifest.dependencies, manifest.id);
    manifest.ui = normalizeUiSection(manifest.ui, manifest.permissions, manifest.sdkVersion);
    if (manifest.entry) manifest.entry = validatePath(manifest.entry);
    if (manifest.contributes.commands.length && !manifest.entry && !Object.keys(manifest.platformEntries).length) {
      throw new Error("commands \u9700\u8981\u63D2\u4EF6 Worker \u5165\u53E3");
    }
    if (!manifest.entry && !Object.keys(manifest.platformEntries).length && !(manifest.contributes.pages || []).length && !manifest.contributes.commands.length && !manifest.contributes.visualSurfaces.length && !manifest.contributes.appearancePacks.length && !manifest.contributes.componentStylePacks.length && !manifest.contributes.componentOverridePacks.length && !manifest.contributes.nativeViews.length && !manifest.contributes.resultPresentations.length && !manifest.contributes.fonts.length && !(manifest.ui?.pages || []).length) {
      throw new Error("\u63D2\u4EF6\u81F3\u5C11\u9700\u8981\u4E00\u4E2A Worker\u3001\u9875\u9762\u3001\u89C6\u89C9\u5C42\u6216\u5916\u89C2\u5305\u5165\u53E3");
    }
    if (manifest.icon) manifest.icon = validatePath(manifest.icon);
    if (manifest.readme) manifest.readme = validatePath(manifest.readme);
    return manifest;
  }

  // ../../packages/cyrene-core/src/ui-tree.js
  var KEY_PATTERN = /^[a-z][a-z0-9._-]{0,63}$/i;
  var ICON_PATTERN = /^[a-z0-9][a-z0-9:_-]{0,99}$/i;
  var ALLOWED_NODE_FIELDS = /* @__PURE__ */ new Set([
    "type",
    "id",
    "title",
    "titleEn",
    "children",
    "action",
    "gap",
    "label",
    "placeholder",
    "rows",
    "path",
    "itemsPath",
    "template",
    "options",
    "value",
    "text",
    "variant",
    "tone",
    "icon",
    "min",
    "max",
    "step"
  ]);
  function uiTreeError(message) {
    return Object.assign(new Error(message), { code: "UI_TREE_INVALID" });
  }
  function validateBindingPath(raw, label, writable, { itemContext = false } = {}) {
    if (typeof raw !== "string" || raw.length > 200) throw uiTreeError(`${label} \u7ED1\u5B9A\u8DEF\u5F84\u65E0\u6548`);
    if (itemContext && (raw === "item" || raw.startsWith("item."))) {
      const field = raw.slice("item.".length);
      if (!field || !KEY_PATTERN.test(field)) throw uiTreeError(`${label} \u5217\u8868\u9879\u5B57\u6BB5\u65E0\u6548\uFF1A${field}`);
      return { source: "item", path: raw, writable: false };
    }
    const source = UI_TREE_BINDING_SOURCES.filter((candidate) => raw === candidate || raw.startsWith(`${candidate}.`)).sort((left, right) => right.length - left.length)[0];
    if (!source) throw uiTreeError(`${label} \u7ED1\u5B9A\u6E90\u4E0D\u53D7\u652F\u6301\uFF1A${raw.split(".")[0]}`);
    const remainder = raw.slice(source.length + 1);
    if (source === "core") {
      const resource = remainder.split(".")[0];
      if (!UI_TREE_CORE_READONLY_SOURCES.includes(resource)) throw uiTreeError(`${label} \u6838\u5FC3\u5FEB\u7167\u53EA\u8BFB\u6E90\u65E0\u6548\uFF1A${resource || "\u7F3A\u5931"}`);
      if (remainder.split(".").length > 1 || writable) throw uiTreeError(`${label} \u6838\u5FC3\u5FEB\u7167\u4E3A\u53EA\u8BFB`);
      return { source, path: raw, writable: false };
    }
    if (!remainder || !KEY_PATTERN.test(remainder)) throw uiTreeError(`${label} \u7ED1\u5B9A\u952E\u65E0\u6548\uFF1A${remainder}`);
    if (source === "settings" && !SETTING_PATH_PATTERN.test(remainder)) throw uiTreeError(`${label} \u8BBE\u7F6E\u952E\u65E0\u6548\uFF1A${remainder}`);
    return { source, path: raw, writable: true };
  }
  function validateAction(action, label) {
    if (!action || typeof action !== "object" || Array.isArray(action)) throw uiTreeError(`${label} action \u65E0\u6548`);
    const method = String(action.method || "");
    if (!HOST_BRIDGE_METHODS.some((item) => item.id === method)) throw uiTreeError(`${label} action \u65B9\u6CD5\u4E0D\u5728 HostBridge \u5951\u7EA6\u5185\uFF1A${method}`);
    const args = action.args && typeof action.args === "object" && !Array.isArray(action.args) ? JSON.parse(JSON.stringify(action.args)) : {};
    return { method, args };
  }
  function validateText(raw, label, max = UI_TREE_MAX_TEXT) {
    if (typeof raw !== "string" || raw.length > max) throw uiTreeError(`${label} \u6587\u672C\u65E0\u6548\u6216\u8FC7\u957F`);
    if (/[{};<>\\]/.test(raw)) throw uiTreeError(`${label} \u6587\u672C\u5305\u542B\u4E0D\u5B89\u5168\u5185\u5BB9`);
    return raw;
  }
  function validateOptions(raw, label) {
    if (!Array.isArray(raw) || !raw.length || raw.length > UI_TREE_MAX_OPTIONS) throw uiTreeError(`${label} options \u5FC5\u987B\u5305\u542B 1-${UI_TREE_MAX_OPTIONS} \u9879`);
    const values = /* @__PURE__ */ new Set();
    return raw.map((option, index) => {
      if (!option || typeof option !== "object" || Array.isArray(option)) throw uiTreeError(`${label}.options[${index}] \u65E0\u6548`);
      const value = String(option.value || "");
      if (!value || value.length > 200 || values.has(value)) throw uiTreeError(`${label}.options[${index}] value \u65E0\u6548\u6216\u91CD\u590D`);
      values.add(value);
      return { value, label: validateText(String(option.label || value), `${label}.options[${index}].label`) };
    });
  }
  function normalizeControl(node, label, writable, itemContext) {
    const type = node.type;
    if (!UI_TREE_CONTROL_TYPES.includes(type)) throw uiTreeError(`${label} \u63A7\u4EF6\u7C7B\u578B\u4E0D\u53D7\u652F\u6301\uFF1A${type}`);
    const result = { type };
    if (node.id) result.id = String(node.id);
    if (type === "text") {
      if (node.path) result.binding = validateBindingPath(node.path, label, false, { itemContext });
      else result.value = validateText(String(node.value ?? ""), `${label}.value`);
    }
    if (type === "button") {
      result.label = validateText(String(node.label || ""), `${label}.label`, 120);
      if (node.variant !== void 0) {
        if (!UI_TREE_BUTTON_VARIANTS.includes(node.variant)) throw uiTreeError(`${label} button variant \u65E0\u6548`);
        result.variant = node.variant;
      }
      result.action = validateAction(node.action, label);
    }
    if (["text-input", "multiline-input", "toggle", "checkbox", "slider", "number-stepper", "progress"].includes(type)) {
      if (type === "text-input" || type === "multiline-input") {
        if (node.label !== void 0) result.label = validateText(String(node.label), `${label}.label`, 120);
        if (node.placeholder !== void 0) result.placeholder = validateText(String(node.placeholder), `${label}.placeholder`, 120);
        if (type === "multiline-input" && node.rows !== void 0) {
          const rows = Number(node.rows);
          if (!Number.isInteger(rows) || rows < 1 || rows > 16) throw uiTreeError(`${label}.rows \u65E0\u6548`);
          result.rows = rows;
        }
      }
      if (["toggle", "checkbox"].includes(type)) result.label = validateText(String(node.label || ""), `${label}.label`, 120);
      if (type === "slider" || type === "number-stepper") {
        if (type === "slider") {
          if (node.label !== void 0) result.label = validateText(String(node.label), `${label}.label`, 120);
          const min = Number(node.min);
          const max = Number(node.max);
          if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) throw uiTreeError(`${label} \u8303\u56F4\u65E0\u6548`);
          result.min = min;
          result.max = max;
          if (node.step !== void 0) {
            const step = Number(node.step);
            if (!Number.isFinite(step) || step <= 0) throw uiTreeError(`${label}.step \u65E0\u6548`);
            result.step = step;
          }
        }
        if (type === "number-stepper") {
          if (node.min !== void 0 || node.max !== void 0) {
            const min = Number(node.min);
            const max = Number(node.max);
            if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) throw uiTreeError(`${label} \u8303\u56F4\u65E0\u6548`);
            result.min = min;
            result.max = max;
          }
        }
      }
      if (node.path) result.binding = validateBindingPath(node.path, label, writable, { itemContext });
    }
    if (["radio", "select"].includes(type)) {
      result.label = validateText(String(node.label || ""), `${label}.label`, 120);
      result.options = validateOptions(node.options, label);
      if (node.path) result.binding = validateBindingPath(node.path, label, writable, { itemContext });
    }
    if (type === "list") {
      result.itemsPath = validateBindingPath(node.itemsPath, `${label}.itemsPath`, false);
      if (result.itemsPath.writable) throw uiTreeError(`${label} \u5217\u8868\u6570\u636E\u6E90\u5FC5\u987B\u4E3A\u53EA\u8BFB`);
      if (!node.template || typeof node.template !== "object" || Array.isArray(node.template)) throw uiTreeError(`${label}.template \u65E0\u6548`);
      result.template = normalizeNode(node.template, `${label}.template`, writable, 1, true);
    }
    if (type === "badge") {
      if (node.text !== void 0) result.text = validateText(String(node.text), `${label}.text`, 120);
      else if (node.path) result.binding = validateBindingPath(node.path, label, false, { itemContext });
      else throw uiTreeError(`${label} badge \u9700\u8981 text \u6216 path`);
      if (node.tone !== void 0) {
        if (!UI_TREE_TONES.includes(node.tone)) throw uiTreeError(`${label} badge tone \u65E0\u6548`);
        result.tone = node.tone;
      }
    }
    if (type === "icon") {
      const icon = String(node.icon || "");
      if (!ICON_PATTERN.test(icon)) throw uiTreeError(`${label} icon \u65E0\u6548`);
      result.icon = icon;
    }
    if (node.action !== void 0) result.action = validateAction(node.action, label);
    return result;
  }
  function normalizeNode(raw, label, writable, depth, itemContext = false) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw uiTreeError(`${label} \u8282\u70B9\u65E0\u6548`);
    if (depth > UI_TREE_MAX_DEPTH) throw uiTreeError(`${label} \u8D85\u8FC7\u6700\u5927\u5D4C\u5957\u6DF1\u5EA6 ${UI_TREE_MAX_DEPTH}`);
    const unknownField = Object.keys(raw).find((key) => !ALLOWED_NODE_FIELDS.has(key));
    if (unknownField) throw uiTreeError(`${label} \u4E0D\u5141\u8BB8\u5B57\u6BB5 ${unknownField}`);
    const type = String(raw.type || "");
    if (!UI_TREE_NODE_TYPES.includes(type)) throw uiTreeError(`${label} \u8282\u70B9\u7C7B\u578B\u4E0D\u53D7\u652F\u6301\uFF1A${type}`);
    if (raw.id !== void 0 && !CONTRIBUTION_ID_PATTERN.test(String(raw.id || ""))) throw uiTreeError(`${label} \u8282\u70B9 ID \u65E0\u6548`);
    const result = { type };
    if (raw.id) result.id = String(raw.id);
    if (["page", "section", "card"].includes(type)) {
      if (raw.title !== void 0) result.title = validateText(String(raw.title), `${label}.title`, 120);
      if (raw.titleEn !== void 0) result.titleEn = validateText(String(raw.titleEn), `${label}.titleEn`, 120);
    }
    if (type === "row" || type === "column") {
      if (raw.gap !== void 0) {
        const gap = Number(raw.gap);
        if (!Number.isFinite(gap) || gap < 0 || gap > 64) throw uiTreeError(`${label}.gap \u65E0\u6548`);
        result.gap = gap;
      }
    }
    if (type === "list") {
      return normalizeControl(raw, label, writable, itemContext);
    }
    if (UI_TREE_CONTROL_TYPES.includes(type)) {
      return normalizeControl(raw, label, writable, itemContext);
    }
    if (raw.children !== void 0) {
      if (!Array.isArray(raw.children) || !raw.children.length || raw.children.length > UI_TREE_MAX_CHILDREN) {
        throw uiTreeError(`${label} children \u5FC5\u987B\u5305\u542B 1-${UI_TREE_MAX_CHILDREN} \u9879`);
      }
      result.children = raw.children.map((child, index) => normalizeNode(child, `${label}.children[${index}]`, writable, depth + 1, itemContext));
    }
    if (raw.action !== void 0) result.action = validateAction(raw.action, label);
    return result;
  }
  function normalizeUiTree(raw, { pluginId = "" } = {}) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw uiTreeError("UI \u58F0\u660E\u6811\u65E0\u6548");
    if (raw.schemaVersion !== UI_TREE_SCHEMA_VERSION) throw uiTreeError(`UI \u58F0\u660E\u6811 schemaVersion \u5FC5\u987B\u4E3A ${UI_TREE_SCHEMA_VERSION}`);
    if (!raw.root || typeof raw.root !== "object" || Array.isArray(raw.root)) throw uiTreeError("UI \u58F0\u660E\u6811\u7F3A\u5C11 root");
    if (pluginId && raw.root.type === "page" && raw.root.id && String(raw.root.id) !== `${pluginId}.main`) {
      if (raw.root.id !== pluginId) throw uiTreeError(`UI \u58F0\u660E\u6811 root.id \u4E0E\u63D2\u4EF6 ID \u4E0D\u4E00\u81F4\uFF1A${raw.root.id}`);
    }
    let nodeCount = 0;
    const countNodes = (node) => {
      nodeCount += 1;
      if (nodeCount > UI_TREE_MAX_NODES) throw uiTreeError(`UI \u58F0\u660E\u6811\u8D85\u8FC7\u6700\u5927\u8282\u70B9\u6570 ${UI_TREE_MAX_NODES}`);
      for (const child of node.children || []) countNodes(child);
      if (node.template) countNodes(node.template);
    };
    countNodes(raw.root);
    const root = normalizeNode(raw.root, "root", true, 1);
    return { schemaVersion: UI_TREE_SCHEMA_VERSION, root, nodeCount };
  }

  // ../../packages/cyrene-core/src/ui-tree-render-plan.js
  function resolveBinding(binding, dataContext = {}) {
    if (!binding) return void 0;
    const { source, path } = binding;
    if (source === "settings") return dataContext.settings?.[path.slice("settings.".length)];
    if (source === "plugin") return dataContext.pluginStorage?.[path.slice("plugin.storage.".length)];
    if (source === "ui.state") return dataContext.uiState?.[path.slice("ui.state.".length)];
    if (source === "core") return dataContext.core?.[path.slice("core.".length)];
    if (source === "item") return dataContext.item?.[path.slice("item.".length)];
    return void 0;
  }
  function planNode(node, dataContext, depth) {
    const plan = { kind: node.type };
    if (node.id) plan.id = node.id;
    if (node.title) plan.title = node.title;
    if (node.titleEn) plan.titleEn = node.titleEn;
    if (node.gap !== void 0) plan.gap = node.gap;
    if (node.label) plan.label = node.label;
    if (node.variant) plan.variant = node.variant;
    if (node.tone) plan.tone = node.tone;
    if (node.icon) plan.icon = node.icon;
    if (node.rows) plan.rows = node.rows;
    if (node.placeholder) plan.placeholder = node.placeholder;
    if (node.min !== void 0) plan.min = node.min;
    if (node.max !== void 0) plan.max = node.max;
    if (node.step !== void 0) plan.step = node.step;
    if (node.options) plan.options = node.options;
    if (node.value !== void 0) plan.value = node.value;
    if (node.text !== void 0) plan.text = node.text;
    if (node.action) plan.action = node.action;
    if (node.binding) {
      plan.binding = { source: node.binding.source, path: node.binding.path, value: resolveBinding(node.binding, dataContext) };
    }
    if (node.children) plan.children = node.children.map((child) => planNode(child, dataContext, depth + 1));
    return plan;
  }
  function buildRenderPlan(tree, dataContext = {}) {
    if (!tree?.root) throw Object.assign(new Error("UI \u6E32\u67D3\u8BA1\u5212\u9700\u8981\u5DF2\u6821\u9A8C\u7684\u58F0\u660E\u6811"), { code: "UI_TREE_INVALID" });
    const root = planNode(tree.root, dataContext, 1);
    return { schemaVersion: tree.schemaVersion, nodeCount: tree.nodeCount, root };
  }
  return __toCommonJS(index_exports);
})();
