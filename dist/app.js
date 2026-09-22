(() => {
  const tree = window.TREE_DATA;
  const research = window.RESEARCH_DATA;
  const STORAGE_KEY = 'heritage-person-edits-v1';
  const readEdits = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  };
  const savedEdits = readEdits();
  const CURRENT_YEAR = new Date().getFullYear();
  const lowercaseWords = new Set(['a', 'al', 'da', 'das', 'de', 'del', 'do', 'dos', 'e', 'el', 'la', 'las', 'los', 'por', 'y']);
  const titleCase = (value = '', lowerInitialParticle = false) => {
    if (value == null) return '';
    return String(value).trim().toLocaleLowerCase('es-ES').split(/(\s+|-)/).map((part, index) => {
      if (!part || /^(\s+|-)$/.test(part)) return part;
      if ((index > 0 || lowerInitialParticle) && lowercaseWords.has(part)) return part;
      return part.charAt(0).toLocaleUpperCase('es-ES') + part.slice(1);
    }).join('');
  };
  const splitPlace = (place = '') => {
    const parts = String(place ?? '').split(',').map((part) => part.trim()).filter(Boolean);
    return {
      city: parts[0] || '',
      region: parts.length >= 4 ? parts[2] : (parts[1] || ''),
      country: parts.length >= 4 ? parts[3] : (parts[2] || '')
    };
  };
  const normalizeEvent = (event) => {
    if (!event) return null;
    const parsed = splitPlace(event.place);
    return {
      ...event,
      city: titleCase(event.city ?? parsed.city),
      region: titleCase(event.region ?? parsed.region),
      country: titleCase(event.country ?? parsed.country)
    };
  };
  const people = tree.individuals.map((source) => {
    const person = { ...source, name: titleCase(source.name), given: titleCase(source.given), surname: titleCase(source.surname, true), birth: normalizeEvent(source.birth), death: normalizeEvent(source.death) };
    const edit = savedEdits[source.id];
    if (edit) {
      person.given = titleCase(edit.given ?? person.given);
      person.surname = titleCase(edit.surname ?? person.surname, true);
      person.name = `${person.given || ''} ${person.surname || ''}`.trim() || person.name;
      person.sex = edit.sex || person.sex;
      person.birth = edit.birth ? normalizeEvent({ ...(person.birth || {}), ...edit.birth }) : person.birth;
      if (Object.prototype.hasOwnProperty.call(edit, 'death')) person.death = edit.death ? normalizeEvent({ ...(person.death || {}), ...edit.death }) : null;
      person.birthYear = edit.birthYear ?? person.birthYear;
      person.deathYear = edit.deathYear ?? person.deathYear;
      person.localEdit = { updatedAt: edit.updatedAt };
    }
    [person.birth, person.death].filter(Boolean).forEach((event) => {
      event.country = event.country || 'España';
      event.place = [event.city || '', event.region || '', event.country].filter(Boolean).join(', ');
    });
    if (!person.death && Number.isFinite(person.birthYear) && person.birthYear < CURRENT_YEAR - 100) {
      person.living = false;
      person.inferredDeceased = true;
      person.inferredDeathReason = 'age';
    }
    return person;
  });
  const families = tree.families;
  const personById = new Map(people.map((person) => [person.id, person]));
  const familyById = new Map(families.map((family) => [family.id, family]));
  const issuesByPerson = new Map();

  research.findings.forEach((finding) => {
    [finding.personId, finding.relatedId].filter(Boolean).forEach((id) => {
      if (!issuesByPerson.has(id)) issuesByPerson.set(id, []);
      issuesByPerson.get(id).push(finding);
    });
  });
  const state = {
    focusId: personById.has('@I500001@') ? '@I500001@' : people[0]?.id,
    privacy: false,
    peopleFilter: 'all',
    peopleQuery: '',
    viewport: { x: 0, y: 0, scale: 0.7 },
    layout: null,
    drag: null,
    sidebarCollapsed: window.innerWidth <= 760,
    treeBranch: 'all',
    treeGenerations: 'all',
    directOnly: false,
    visibleIds: new Set()
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const normalize = (value) => value.toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const communityColors = {
    'Andalucía': '#edf7e9', 'Aragón': '#f9eee4', 'Principado de Asturias': '#e8f2fb',
    'Illes Balears': '#e8f6f7', 'Canarias': '#fff6d8',     'Cantabria': '#e4d9f0',
    'Castilla-La Mancha': '#f6eee1', 'Castilla y León': '#f7eedc', 'Cataluña': '#fff0df',
    'Comunitat Valenciana': '#fff0eb', 'Extremadura': '#edf4e1', 'Galicia': '#e7f4ed',
    'Comunidad de Madrid': '#f0ebf8', 'Región de Murcia': '#faece2',
    'Comunidad Foral de Navarra': '#f5e7e5', 'País Vasco': '#e7f2e8', 'La Rioja': '#f8e9ee',
    'Ceuta': '#e9f3f7', 'Melilla': '#eeeefa'
  };
  const familyBranches = [
    { key: 'paternal-grandmother', rootId: '@I500005@', label: 'Abuela paterna', person: 'Teófila Maíllo Martín', color: '#f8e9a6', wash: '#f1cf45', anchors: ['@I500003@', '@I500001@'] },
    { key: 'paternal-grandfather', rootId: '@I500006@', label: 'Abuelo paterno', person: 'Francisco Sierra Martínez', color: '#d8edbd', wash: '#86b94c', anchors: ['@I500003@', '@I500001@'] },
    { key: 'maternal-grandmother', rootId: '@I500004@', label: 'Abuela materna', person: 'Edelmira Pérez', color: '#cfeafb', wash: '#62afe0', anchors: ['@I500002@', '@I500001@'] },
    { key: 'maternal-grandfather', rootId: '@I500007@', label: 'Abuelo materno', person: 'Santiago Martínez García', color: '#e1d3f3', wash: '#9a70c9', anchors: ['@I500002@', '@I500001@'] }
  ];
  const communityAliases = [
    ['Principado de Asturias', ['asturias', 'oviedo', 'aviles', 'navia', 'coana']],
    ['Castilla y León', ['castilla y leon', 'salamanca', 'palencia', 'burgos', 'valladolid', 'zamora', 'segovia', 'avila', 'leon']],
    ['Galicia', ['galicia', 'coruna', 'a coruna', 'lugo', 'ourense', 'pontevedra', 'barquero']],
    ['Andalucía', ['andalucia']], ['Aragón', ['aragon']], ['Illes Balears', ['illes balears', 'islas baleares', 'baleares']],
    ['Canarias', ['canarias']], ['Cantabria', ['cantabria']], ['Castilla-La Mancha', ['castilla-la mancha', 'castilla la mancha']],
    ['Cataluña', ['cataluna', 'catalunya']], ['Comunitat Valenciana', ['comunitat valenciana', 'comunidad valenciana']],
    ['Extremadura', ['extremadura']], ['Comunidad de Madrid', ['comunidad de madrid', 'madrid']],
    ['Región de Murcia', ['region de murcia', 'murcia']], ['Comunidad Foral de Navarra', ['navarra']],
    ['País Vasco', ['pais vasco', 'euskadi']], ['La Rioja', ['la rioja']], ['Ceuta', ['ceuta']], ['Melilla', ['melilla']]
  ];
  const birthCommunity = (person) => {
    const birth = person.birth || {};
    const regionText = normalize(birth.region || '');
    const placeText = normalize(`${birth.city || ''} ${birth.place || ''}`);
    const direct = communityAliases.find(([, aliases]) => aliases.some((alias) => regionText === alias || regionText.includes(alias)));
    if (direct) return direct[0];
    const inferred = communityAliases.slice(0, 3).find(([, aliases]) => aliases.some((alias) => placeText.includes(alias)));
    return inferred?.[0] || '';
  };
  const siblingRegionEvidence = new Map();
  families.forEach((family) => {
    const siblings = family.children.map((id) => personById.get(id)).filter(Boolean);
    const known = siblings.map((person) => ({ person, community: birthCommunity(person) })).filter((item) => item.community);
    const communities = new Set(known.map((item) => item.community));
    if (communities.size !== 1) return;
    const community = known[0].community;
    siblings.forEach((person) => {
      if (birthCommunity(person) || person.birth?.country && person.birth.country !== 'España') return;
      if (Object.prototype.hasOwnProperty.call(savedEdits[person.id]?.birth || {}, 'region')) return;
      if (!siblingRegionEvidence.has(person.id)) siblingRegionEvidence.set(person.id, new Map());
      const byCommunity = siblingRegionEvidence.get(person.id);
      if (!byCommunity.has(community)) byCommunity.set(community, new Set());
      known.forEach(({ person: sibling }) => byCommunity.get(community).add(sibling.name));
    });
  });
  siblingRegionEvidence.forEach((evidence, id) => {
    if (evidence.size !== 1) return;
    const person = personById.get(id);
    const [community, siblingNames] = [...evidence][0];
    const city = person.birth?.city || '';
    person.birth = normalizeEvent({ ...(person.birth || {}), city, region: community, country: 'España', place: [city, community, 'España'].filter(Boolean).join(', ') });
    person.inferredBirthRegionFromSibling = [...siblingNames];
  });
  const communityAppearance = (person) => {
    const community = birthCommunity(person);
    return { community, color: communityColors[community] || '#fffdf8' };
  };
  const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const firstSurname = (person) => (person.surname || person.name).trim().split(/\s+/)[0] || '';
  const privateName = (person) => state.privacy ? `${(person.given || person.name).trim().charAt(0).toUpperCase()}. ${firstSurname(person)}` : person.name;
  const monthMap = { JAN: 'ENE', FEB: 'FEB', MAR: 'MAR', APR: 'ABR', MAY: 'MAY', JUN: 'JUN', JUL: 'JUL', AUG: 'AGO', SEP: 'SEP', OCT: 'OCT', NOV: 'NOV', DEC: 'DIC' };
  const formatDate = (date) => {
    if (!date) return 'Sin fecha';
    const match = String(date).trim().match(/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/i);
    if (match && monthMap[match[2].toUpperCase()]) {
      const monthNumber = Object.keys(monthMap).indexOf(match[2].toUpperCase()) + 1;
      return `${match[1].padStart(2, '0')}/${String(monthNumber).padStart(2, '0')}/${match[3]}`;
    }
    return Object.entries(monthMap).reduce((text, [en, es]) => text.replace(new RegExp(`\\b${en}\\b`, 'g'), es), String(date));
  };
  const eventPlace = (person, type = 'birth', compact = false) => {
    const event = person[type] || {};
    const parts = [event.city || '', event.region || '', event.country || ''];
    if (compact) return parts.map((part) => part || '—').join(' · ');
    return `Ciudad: ${parts[0] || 'Sin registrar'} · Comunidad autónoma: ${parts[1] || 'Sin registrar'} · País: ${parts[2] || 'Sin registrar'}`;
  };
  const lifeLabel = (person) => {
    if (state.privacy) return 'Datos protegidos';
    return `${person.birthYear || '?'} — ${person.death || person.inferredDeceased ? (person.deathYear || '†') : (person.living ? 'actualidad' : '?')}`;
  };
  const placeLabel = (person) => eventPlace(person, 'birth', true);
  const hasWarning = (person) => (issuesByPerson.get(person.id) || []).some((item) => ['critical', 'warning'].includes(item.severity));
  const isTraditional = (person) => (person.notes || []).some((note) => normalize(note).includes('tradicion'));
  const sourceNames = {
    '@S500001@': 'Árbol RODRIGUEZ de Sagrario Rodríguez (MyHeritage)',
    '@S500002@': 'Árbol CASCON MARTIN de María Cascón Martín (MyHeritage)'
  };
  const provenanceOf = (person) => {
    const refs = (person.sourceRefs || []).map((ref) => sourceNames[ref] || `Referencia GED ${ref}`);
    const fromNotes = (person.notes || []).flatMap((note) => [...String(note).matchAll(/(?:Fuente|Según)\s*:\s*([^.;]+(?:\.[^.;]+)?)/gi)].map((match) => match[1].trim()));
    if (person.localEdit) refs.unshift('Edición manual local (datos modificados)');
    return [...new Set([...refs, ...fromNotes])].join(' · ') || 'Archivo GED familiar; procedencia original no detallada';
  };
  const relevantOf = (person) => {
    const notes = (person.notes || []).map((note) => String(note).trim()).filter((note) => note && !/^(?:Fuente|Según)\s*:/i.test(note));
    if (person.inferredBirthRegionFromSibling) notes.push(`Comunidad de nacimiento inferida por ${person.inferredBirthRegionFromSibling.length === 1 ? 'su hermano/a' : 'sus hermanos/as'} ${person.inferredBirthRegionFromSibling.join(', ')}; localidad no confirmada.`);
    return notes;
  };
  const provenanceMarkup = (person, compact = false) => {
    const relevant = relevantOf(person);
    const source = provenanceOf(person);
    const rowClass = compact ? ' card-info-row compact' : ' card-info-row';
    return `<div class="card-info"><div class="${rowClass.trim()}" title="${escapeHtml(source)}"><span>Fuente</span><span>${escapeHtml(source)}</span></div><div class="${rowClass.trim()}" title="${escapeHtml(relevant.join(' · '))}"><span>Información relevante</span><span>${escapeHtml(relevant.length ? relevant.join(' · ') : 'Sin información adicional')}</span></div></div>`;
  };
  const sexClass = (person) => person.sex === 'M' ? 'sex-m' : person.sex === 'F' ? 'sex-f' : 'sex-u';
  const avatar = (person, className = '') => {
    const hidden = state.privacy;
    if (person.localPhoto && !hidden) return `<img class="avatar ${className}" src="${escapeHtml(person.localPhoto)}" alt="Retrato de ${escapeHtml(person.name)}">`;
    return `<span class="avatar ${className}" aria-hidden="true">${escapeHtml(hidden ? (person.given || person.name).trim().charAt(0).toUpperCase() : initials(person.name))}</span>`;
  };

  function parentsOf(person) {
    const family = familyById.get(person.familyChild);
    return family ? [family.husband, family.wife].map((id) => personById.get(id)).filter(Boolean) : [];
  }
  function spousesOf(person) {
    const ids = new Set();
    person.familySpouse.forEach((familyId) => {
      const family = familyById.get(familyId);
      [family?.husband, family?.wife].forEach((id) => { if (id && id !== person.id) ids.add(id); });
    });
    return [...ids].map((id) => personById.get(id)).filter(Boolean);
  }
  function childrenOf(person) {
    const ids = new Set();
    person.familySpouse.forEach((familyId) => familyById.get(familyId)?.children.forEach((id) => ids.add(id)));
    return [...ids].map((id) => personById.get(id)).filter(Boolean);
  }

  function ancestorIds(rootId) {
    const found = new Set();
    const pending = [rootId];
    while (pending.length) {
      const id = pending.pop();
      if (!id || found.has(id) || !personById.has(id)) continue;
      found.add(id);
      parentsOf(personById.get(id)).forEach((parent) => pending.push(parent.id));
    }
    return found;
  }
  function relationshipDistances(rootId) {
    const distances = new Map([[rootId, 0]]);
    const pending = [rootId];
    for (let index = 0; index < pending.length; index += 1) {
      const person = personById.get(pending[index]);
      if (!person) continue;
      const nextDistance = distances.get(person.id) + 1;
      [...parentsOf(person), ...childrenOf(person)].forEach((relative) => {
        if (distances.has(relative.id)) return;
        distances.set(relative.id, nextDistance);
        pending.push(relative.id);
      });
    }
    return distances;
  }
  const relationshipDistance = relationshipDistances('@I500001@');
  const directAncestorIds = ancestorIds('@I500001@');
  const generationsFromRoot = new Map([['@I500001@', 0]]);
  const generationQueue = ['@I500001@'];
  for (let index = 0; index < generationQueue.length; index += 1) {
    const id = generationQueue[index];
    parentsOf(personById.get(id)).forEach((parent) => {
      if (generationsFromRoot.has(parent.id)) return;
      generationsFromRoot.set(parent.id, generationsFromRoot.get(id) + 1);
      generationQueue.push(parent.id);
    });
  }
  const familyAdjacency = new Map(people.map((person) => [person.id, new Set()]));
  families.forEach((family) => {
    const members = [family.husband, family.wife, ...family.children].filter((id) => familyAdjacency.has(id));
    members.forEach((id) => members.forEach((relativeId) => {
      if (id !== relativeId) familyAdjacency.get(id).add(relativeId);
    }));
  });
  const connectedToRootIds = new Set(['@I500001@']);
  const connectionQueue = ['@I500001@'];
  for (let index = 0; index < connectionQueue.length; index += 1) {
    familyAdjacency.get(connectionQueue[index]).forEach((relativeId) => {
      if (connectedToRootIds.has(relativeId)) return;
      connectedToRootIds.add(relativeId);
      connectionQueue.push(relativeId);
    });
  }
  // Display-only estimates: first documented activity minus an assumed adult age.
  // These are not birth dates and do not establish a family connection.
  const isolatedActivityYears = new Map([
    ['@I500250@', 1524],
    ['@I500253@', 1542],
    ['@I500254@', 1554]
  ]);
  function visibleTreePeople() {
    const branch = familyBranches.find((item) => item.key === state.treeBranch);
    const maxGenerations = state.treeGenerations === 'all' ? Infinity : Number(state.treeGenerations);
    const branchIds = branch ? new Set(branch.memberIds) : null;
    if (branchIds && !state.directOnly) {
      // Add immediate siblings and partners without importing the other grandparent branches.
      families.forEach((family) => {
        const parentInBranch = [family.husband, family.wife].some((id) => id && branch.memberIds.has(id) && !branch.anchors.includes(id));
        if (!parentInBranch) return;
        [family.husband, family.wife, ...family.children].filter(Boolean).forEach((id) => branchIds.add(id));
      });
    }
    return people.filter((person) => {
      if (branchIds && !branchIds.has(person.id)) return false;
      if (state.directOnly && !directAncestorIds.has(person.id)) return false;
      if (maxGenerations !== Infinity) {
        const depth = generationsFromRoot.get(person.id);
        const parentDepths = parentsOf(person).map((parent) => generationsFromRoot.get(parent.id)).filter(Number.isFinite);
        const nearDepth = Number.isFinite(depth) ? depth : (parentDepths.length ? Math.min(...parentDepths) + 1 : Infinity);
        if (nearDepth > maxGenerations) return false;
      }
      return true;
    });
  }
  const connectorWidthForFamily = (family) => {
    const memberIds = [family.husband, family.wife, ...family.children].filter(Boolean);
    const distances = memberIds.map((id) => relationshipDistance.get(id)).filter(Number.isFinite);
    if (!distances.length) return 1.25;
    return Math.max(1.25, 5 - Math.min(...distances) * 0.48);
  };
  familyBranches.forEach((branch) => {
    branch.memberIds = ancestorIds(branch.rootId);
    branch.anchors.forEach((id) => { if (personById.has(id)) branch.memberIds.add(id); });
  });
  const branchesForPerson = (person) => familyBranches.filter((branch) => branch.memberIds.has(person.id));
  const branchBackground = (person) => {
    const branches = branchesForPerson(person);
    if (!branches.length) return '';
    if (branches.length === 1) return branches[0].color;
    const stops = branches.flatMap((branch, index) => {
      const start = Math.round(index * 100 / branches.length);
      const end = Math.round((index + 1) * 100 / branches.length);
      return [`${branch.color} ${start}%`, `${branch.color} ${end}%`];
    });
    return `linear-gradient(135deg, ${stops.join(', ')})`;
  };

  function buildLayout(visiblePeople, visibleFamilies) {
    const recordedBirthYear = (person) => {
      if (Number.isFinite(person.birthYear)) return person.birthYear;
      const recordedYear = Number(String(person.birth?.date || '').match(/(1[0-9]{3}|20[0-9]{2})/)?.[1]);
      if (Number.isFinite(recordedYear) && recordedYear > 0) return recordedYear;
      return null;
    };
    const layoutBirthYear = (person) => {
      const recordedYear = recordedBirthYear(person);
      if (Number.isFinite(recordedYear)) return recordedYear;
      if (Number.isFinite(person.deathYear)) return person.deathYear - 35;
      if (isolatedActivityYears.has(person.id)) return isolatedActivityYears.get(person.id) - 30;
      return null;
    };
    const visibleIds = new Set(visiblePeople.map((person) => person.id));
    const adjacency = new Map(visiblePeople.map((person) => [person.id, []]));
    visibleFamilies.forEach((family) => {
      const parents = [family.husband, family.wife].filter((id) => visibleIds.has(id));
      if (parents.length === 2) {
        adjacency.get(parents[0]).push([parents[1], 0]);
        adjacency.get(parents[1]).push([parents[0], 0]);
      }
      family.children.filter((id) => visibleIds.has(id)).forEach((child) => parents.forEach((parent) => {
        adjacency.get(parent).push([child, 1]);
        adjacency.get(child).push([parent, -1]);
      }));
    });
    const generation = new Map();
    let component = 0;
    visiblePeople.forEach((start) => {
      if (generation.has(start.id)) return;
      const queue = [start.id];
      generation.set(start.id, { level: 0, component });
      for (let index = 0; index < queue.length; index += 1) {
        const current = queue[index];
        const currentLevel = generation.get(current).level;
        adjacency.get(current).forEach(([next, delta]) => {
          if (!generation.has(next)) {
            generation.set(next, { level: currentLevel + delta, component });
            queue.push(next);
          }
        });
      }
      component += 1;
    });
    const minLevel = Math.min(...[...generation.values()].map((item) => item.level));
    generation.forEach((item) => { item.level -= minLevel; });
    const spouseRoot = new Map(visiblePeople.map((person) => [person.id, person.id]));
    const findRoot = (id) => {
      let current = id;
      while (spouseRoot.get(current) !== current) current = spouseRoot.get(current);
      return current;
    };
    const joinSpouses = (left, right) => {
      const leftRoot = findRoot(left);
      const rightRoot = findRoot(right);
      if (leftRoot !== rightRoot) spouseRoot.set(rightRoot, leftRoot);
    };
    visibleFamilies.forEach((family) => {
      if (visibleIds.has(family.husband) && visibleIds.has(family.wife)) joinSpouses(family.husband, family.wife);
    });
    const nodeWidth = 240;
    const nodeHeight = state.privacy ? 108 : 190;
    const coupleGap = 38;
    const siblingGap = 84;
    const familyGap = 180;
    const decadeHeight = 230;
    const margin = 80;
    const blocks = new Map();
    const levels = new Map();
    visiblePeople.forEach((person) => {
      const level = generation.get(person.id).level;
      const key = `${level}:${findRoot(person.id)}`;
      if (!blocks.has(key)) {
        const block = { members: [], level, component: generation.get(person.id).component, x: 0, width: 0, origins: new Set() };
        blocks.set(key, block);
        if (!levels.has(level)) levels.set(level, []);
        levels.get(level).push(block);
      }
      const block = blocks.get(key);
      block.members.push(person);
      if (person.familyChild) block.origins.add(person.familyChild);
      block.width = block.members.length * nodeWidth + (block.members.length - 1) * coupleGap;
    });
    const blockOf = new Map();
    blocks.forEach((block) => block.members.forEach((person) => blockOf.set(person.id, block)));
    const componentInfo = new Map();
    blocks.forEach((block) => {
      if (!componentInfo.has(block.component)) componentInfo.set(block.component, { id: block.component, blocks: [], branchRank: familyBranches.length, size: 0 });
      const info = componentInfo.get(block.component);
      info.blocks.push(block);
      info.size += block.members.length;
      block.members.forEach((person) => branchesForPerson(person).forEach((branch) => {
        info.branchRank = Math.min(info.branchRank, familyBranches.indexOf(branch));
      }));
    });
    const rootComponent = generation.get('@I500001@')?.component;
    const orderedComponents = [...componentInfo.values()].sort((left, right) => {
      if (left.id === rootComponent) return -1;
      if (right.id === rootComponent) return 1;
      return left.branchRank - right.branchRank || right.size - left.size || left.id - right.id;
    });
    orderedComponents.forEach((info, index) => {
      info.rank = index;
      info.blocks.forEach((block) => { block.componentRank = index; });
    });
    const datedPeople = visiblePeople.filter((person) => Number.isFinite(layoutBirthYear(person)));
    const meanLevel = datedPeople.reduce((sum, person) => sum + generation.get(person.id).level, 0) / datedPeople.length;
    const meanYear = datedPeople.reduce((sum, person) => sum + layoutBirthYear(person), 0) / datedPeople.length;
    const covariance = datedPeople.reduce((sum, person) => sum + (generation.get(person.id).level - meanLevel) * (layoutBirthYear(person) - meanYear), 0);
    const variance = datedPeople.reduce((sum, person) => sum + (generation.get(person.id).level - meanLevel) ** 2, 0);
    const yearsPerGeneration = variance > 0 ? Math.min(35, Math.max(18, covariance / variance)) : 25;
    const yearAtLevelZero = meanYear - yearsPerGeneration * meanLevel;
    blocks.forEach((block) => {
      const knownYears = block.members.map(layoutBirthYear).filter(Number.isFinite);
      block.hasKnownYear = block.members.some((person) => Number.isFinite(recordedBirthYear(person)));
      block.year = knownYears.length
        ? knownYears.reduce((sum, year) => sum + year, 0) / knownYears.length
        : yearAtLevelZero + yearsPerGeneration * block.level;
      block.decade = Math.floor(block.year / 10) * 10;
    });
    // The user treats everyone placed in the 1920–1929 band or any earlier
    // band as deceased, including people whose position is generation-based.
    blocks.forEach((block) => {
      if (block.decade > 1920) return;
      block.members.forEach((person) => {
        if (person.death) return;
        person.living = false;
        person.inferredDeceased = true;
        person.inferredDeathReason = 'historical-band';
      });
    });
    // Keep dated people fixed. Undated relatives may share a decade when the
    // known dates leave less than ten years between several generations.
    for (let pass = 0; pass < 32; pass += 1) {
      visibleFamilies.forEach((family) => {
        const parentBlocks = [family.husband, family.wife].map((id) => blockOf.get(id)).filter(Boolean);
        const childBlocks = family.children.map((id) => blockOf.get(id)).filter(Boolean);
        parentBlocks.forEach((parentBlock) => childBlocks.forEach((childBlock) => {
          if (childBlock.decade >= parentBlock.decade) return;
          if (!childBlock.hasKnownYear) childBlock.decade = parentBlock.decade;
          else if (!parentBlock.hasKnownYear) parentBlock.decade = childBlock.decade;
        }));
      });
    }
    const gapBetween = (left, right) => {
      if ([...left.origins].some((id) => right.origins.has(id))) return siblingGap;
      if (left.component !== right.component) return familyGap + 280;
      return familyGap;
    };
    const orderedLevels = [...levels.keys()].sort((a, b) => a - b);
    levels.forEach((row) => {
      row.sort((a, b) => a.componentRank - b.componentRank);
      let cursor = 0;
      row.forEach((block, index) => {
        if (index) cursor += gapBetween(row[index - 1], block);
        block.x = cursor;
        cursor += block.width;
      });
    });
    // Alternate descendants and ancestors: keep couples together and align related blocks.
    for (let pass = 0; pass < 12; pass += 1) {
      const downward = pass % 2 === 0;
      const traversal = downward ? orderedLevels : [...orderedLevels].reverse();
      traversal.forEach((level) => {
        const row = levels.get(level);
        row.forEach((block) => {
          // Ponderamos cada progenitor según la cercanía de su hijo a la persona
          // de origen (Guillermo). Así la línea principal se mantiene compacta
          // (Guillermo junto a sus padres y hermanos) sin dispersar las ramas
          // colaterales, que conservan su coherencia.
          let weightedSum = 0;
          let weightTotal = 0;
          block.members.forEach((member) => {
            const weight = 1 / (1 + (relationshipDistance.get(member.id) ?? Infinity));
            if (!(weight > 0)) return;
            (downward ? parentsOf(member) : childrenOf(member)).forEach((relative) => {
              const other = blockOf.get(relative.id);
              if (other && other !== block) {
                weightedSum += (other.x + other.width / 2) * weight;
                weightTotal += weight;
              }
            });
          });
          block.target = weightTotal ? weightedSum / weightTotal : block.x + block.width / 2;
        });
        row.sort((a, b) => a.componentRank - b.componentRank || a.target - b.target);
        let rightEdge = -Infinity;
        row.forEach((block, index) => {
          block.x = Math.max(block.target - block.width / 2, rightEdge + (index ? gapBetween(row[index - 1], block) : 0));
          rightEdge = block.x + block.width;
        });
        const drift = row.reduce((sum, block) => sum + block.x + block.width / 2 - block.target, 0) / row.length;
        row.forEach((block) => { block.x -= drift; });
      });
    }
    const decadeRows = new Map();
    blocks.forEach((block) => {
      if (!decadeRows.has(block.decade)) decadeRows.set(block.decade, []);
      decadeRows.get(block.decade).push(block);
    });
    decadeRows.forEach((row) => {
      row.sort((a, b) => a.componentRank - b.componentRank || a.x - b.x);
      let rightEdge = -Infinity;
      row.forEach((block, index) => {
        const minimumX = rightEdge + (index ? gapBetween(row[index - 1], block) : 0);
        if (block.x < minimumX) block.x = minimumX;
        rightEdge = block.x + block.width;
      });
    });
    // Move each connected genealogy as one rigid horizontal unit. This keeps
    // every real family link inside its own lane and prevents an unrelated
    // component from sitting underneath another family's connectors or wash.
    let componentCursor = 0;
    orderedComponents.forEach((info) => {
      const left = Math.min(...info.blocks.map((block) => block.x));
      const right = Math.max(...info.blocks.map((block) => block.x + block.width));
      const shift = componentCursor - left;
      info.blocks.forEach((block) => { block.x += shift; });
      // A lone, unlinked card needs a clear boundary but not the same broad
      // corridor as a multi-person family with visible connector lines.
      componentCursor += right - left + (info.size > 1 ? 440 : 120);
    });
    const minX = Math.min(...[...blocks.values()].map((block) => block.x));
    const maxX = Math.max(...[...blocks.values()].map((block) => block.x + block.width));
    const sceneWidth = maxX - minX + margin * 2;
    const minDecade = Math.min(...[...blocks.values()].map((block) => block.decade));
    const maxDecade = Math.max(...[...blocks.values()].map((block) => block.decade));
    const bandLevels = new Map();
    blocks.forEach((block) => {
      if (!bandLevels.has(block.decade)) bandLevels.set(block.decade, new Set());
      bandLevels.get(block.decade).add(block.level);
    });
    const bands = [];
    let bandY = margin;
    for (let decade = minDecade; decade <= maxDecade; decade += 10) {
      const levelsInBand = [...(bandLevels.get(decade) || [])].sort((a, b) => a - b);
      const height = Math.max(decadeHeight, 100 + levelsInBand.length * (nodeHeight + 92));
      bands.push({ decade, y: bandY, height, levels: levelsInBand });
      bandY += height;
    }
    const bandByDecade = new Map(bands.map((band) => [band.decade, band]));
    const positions = new Map();
    blocks.forEach((block) => {
      const band = bandByDecade.get(block.decade);
      const lane = Math.max(0, band.levels.indexOf(block.level));
      block.members.forEach((person, index) => positions.set(person.id, {
        x: margin + block.x - minX + index * (nodeWidth + coupleGap),
        y: band.y + 60 + lane * (nodeHeight + 92),
        width: nodeWidth,
        height: nodeHeight,
        decade: block.decade,
        estimatedDecade: !block.hasKnownYear
      }));
    });
    return { positions, bands, width: sceneWidth, height: bandY + margin, nodeWidth, nodeHeight };
  }

  function connectorMarkup() {
    const paths = [];
    families.forEach((family, familyIndex) => {
      const lineWidth = connectorWidthForFamily(family);
      const addPath = (path) => paths.push(`<path style="--kinship-line-width:${lineWidth}px" d="${path}"/>`);
      const parents = [family.husband, family.wife].map((id) => state.layout.positions.get(id)).filter(Boolean);
      const children = family.children.map((id) => state.layout.positions.get(id)).filter(Boolean);
      if (!parents.length) return;
      if (!children.length) {
        if (parents.length === 2) {
          const [left, right] = parents.sort((a, b) => a.x - b.x);
          addPath(`M ${left.x + left.width} ${left.y + left.height / 2} H ${right.x}`);
        }
        return;
      }
      const parentCenters = parents.map((pos) => ({ x: pos.x + pos.width / 2, y: pos.y + pos.height }));
      const childCenters = children.map((pos) => ({ x: pos.x + pos.width / 2, y: pos.y }));
      const parentY = Math.max(...parentCenters.map((point) => point.y));
      const childY = Math.min(...childCenters.map((point) => point.y));
      const availableGap = Math.max(0, childY - parentY - 100);
      const laneCount = Math.max(1, Math.min(8, Math.floor(availableGap / 16)));
      const lane = familyIndex % laneCount;
      const marriageY = parentY + 24 + lane * 8;
      const siblingY = Math.max(marriageY + 30, childY - 34 - lane * 8);
      const parentMinX = Math.min(...parentCenters.map((point) => point.x));
      const parentMaxX = Math.max(...parentCenters.map((point) => point.x));
      const junctionX = (parentMinX + parentMaxX) / 2;
      parentCenters.forEach((point) => addPath(`M ${point.x} ${point.y} V ${marriageY}`));
      if (parents.length > 1) addPath(`M ${parentMinX} ${marriageY} H ${parentMaxX}`);
      addPath(`M ${junctionX} ${marriageY} V ${siblingY}`);
      const childMinX = Math.min(...childCenters.map((point) => point.x));
      const childMaxX = Math.max(...childCenters.map((point) => point.x));
      addPath(`M ${Math.min(junctionX, childMinX)} ${siblingY} H ${Math.max(junctionX, childMaxX)}`);
      childCenters.forEach((point) => addPath(`M ${point.x} ${siblingY} V ${point.y}`));
    });
    return paths.join('');
  }

  function branchBackdropMarkup() {
    return familyBranches.map((branch) => {
      const memberPositions = [...branch.memberIds].map((id) => [id, state.layout.positions.get(id)]).filter(([, pos]) => pos);
      const blobs = memberPositions.map(([, pos]) => `<rect x="${pos.x - 42}" y="${pos.y - 34}" width="${pos.width + 84}" height="${pos.height + 68}" rx="52"/>`).join('');
      const paths = [];
      memberPositions.forEach(([id, childPos]) => {
        parentsOf(personById.get(id)).forEach((parent) => {
          if (!branch.memberIds.has(parent.id)) return;
          const parentPos = state.layout.positions.get(parent.id);
          if (!parentPos) return;
          const childX = childPos.x + childPos.width / 2;
          const childY = childPos.y + childPos.height / 2;
          const parentX = parentPos.x + parentPos.width / 2;
          const parentY = parentPos.y + parentPos.height / 2;
          const middleY = (childY + parentY) / 2;
          paths.push(`<path d="M ${childX} ${childY} C ${childX} ${middleY}, ${parentX} ${middleY}, ${parentX} ${parentY}"/>`);
        });
      });
      return `<g data-branch="${branch.key}" style="--branch-wash:${branch.wash}">${paths.join('')}${blobs}</g>`;
    }).join('');
  }

  function nodeMarkup(person) {
    const status = isTraditional(person) ? ['warning', 'Tradición'] : hasWarning(person) ? ['warning', 'Revisar'] : person.birth?.date ? ['verified', 'Con fecha'] : ['pending', 'Incompleto'];
    const pos = state.layout.positions.get(person.id);
    const appearance = communityAppearance(person);
    const familyBackground = branchBackground(person);
    const communityAttributes = appearance.community ? ` data-community="${escapeHtml(appearance.community)}" title="Comunidad de nacimiento: ${escapeHtml(appearance.community)}"` : '';
    const positionStyle = `left:${pos.x}px;top:${pos.y}px;--community-bg:${appearance.color}${familyBackground ? `;--branch-bg:${familyBackground}` : ''}`;
    if (state.privacy) {
      return `<button class="person-node private-card ${sexClass(person)} ${state.focusId === person.id ? 'focus' : ''}" data-person="${person.id}"${communityAttributes} style="${positionStyle}">${avatar(person)}<span class="node-body"><span class="node-name">${escapeHtml(privateName(person))}</span><span class="node-meta">${escapeHtml(eventPlace(person, 'birth', true))}</span></span></button>`;
    }
    return `<button class="person-node ${sexClass(person)} ${state.focusId === person.id ? 'focus' : ''}" data-person="${person.id}"${communityAttributes} style="${positionStyle}">${avatar(person)}<span class="node-body"><span class="node-name">${escapeHtml(privateName(person))}</span><span class="node-meta">${escapeHtml(lifeLabel(person))}<br>${escapeHtml(placeLabel(person))}</span></span><span class="node-status"><i class="dot ${status[0]}"></i>${status[1]}</span>${provenanceMarkup(person, true)}</button>`;
  }

  function applyViewport() {
    const scene = $('#treeScene');
    if (scene) scene.style.transform = `translate(${state.viewport.x}px, ${state.viewport.y}px) scale(${state.viewport.scale})`;
    if ($('#zoomLevel')) $('#zoomLevel').textContent = `${Math.round(state.viewport.scale * 100)}%`;
    $('#readableZoom').hidden = state.viewport.scale >= 0.55;
    if (state.layout) {
      const canvas = $('#treeCanvas');
      const top = -state.viewport.y / state.viewport.scale;
      const bottom = (canvas.clientHeight - state.viewport.y) / state.viewport.scale;
      const bands = state.layout.bands.filter((band) => band.y + band.height >= top && band.y <= bottom);
      $('#visibleEra').textContent = bands.length ? `Época visible · ${bands[0].decade}–${bands[bands.length - 1].decade + 9}` : 'Fuera del árbol · Volver a mí para centrar';
    }
  }
  function renderTree({ preserveView = true } = {}) {
    const visiblePeople = visibleTreePeople();
    state.visibleIds = new Set(visiblePeople.map((person) => person.id));
    if (!state.visibleIds.has(state.focusId)) state.focusId = state.visibleIds.has('@I500001@') ? '@I500001@' : visiblePeople[0]?.id;
    const visibleFamilies = families.filter((family) => [family.husband, family.wife, ...family.children].some((id) => state.visibleIds.has(id)));
    state.layout = buildLayout(visiblePeople, visibleFamilies);
    const canvas = $('#treeCanvas');
    const decadeBands = state.layout.bands.map((band, index) => `<div class="decade-band ${index % 2 ? 'alternate' : ''}" style="top:${band.y}px;height:${band.height}px"><span>${band.decade}–${band.decade + 9}</span></div>`).join('');
    canvas.innerHTML = `<div class="tree-scene" id="treeScene" style="width:${state.layout.width}px;height:${state.layout.height}px">${decadeBands}<svg class="tree-branch-washes" width="${state.layout.width}" height="${state.layout.height}" aria-hidden="true">${branchBackdropMarkup()}</svg><svg class="tree-links" width="${state.layout.width}" height="${state.layout.height}" aria-hidden="true">${connectorMarkup()}</svg>${visiblePeople.map(nodeMarkup).join('')}</div>`;
    $('#treeFilterCount').textContent = `${visiblePeople.length} personas visibles · ${people.length - connectedToRootIds.size} sin vínculo familiar, situadas por época aproximada`;
    bindPersonButtons(canvas);
    updateFocusSummary();
    renderCommunityLegend();
    if (preserveView) applyViewport(); else requestAnimationFrame(() => centerPerson(state.focusId, 0.9));
  }
  function renderCommunityLegend() {
    const communities = [...new Set(people.map(birthCommunity).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    const branchLegend = `<strong>Ramas familiares</strong>${familyBranches.map((branch) => `<span><i style="background:${branch.color}"></i>${escapeHtml(branch.label)} · ${escapeHtml(branch.person)}</span>`).join('')}`;
    const communityLegend = communities.length ? `<strong class="legend-section">Nacimiento (si no pertenece a una rama)</strong>${communities.map((community) => `<span><i style="background:${communityColors[community]}"></i>${escapeHtml(community)}</span>`).join('')}` : '';
    $('#communityLegend').innerHTML = branchLegend + communityLegend;
  }
  function updateFocusSummary() {
    const person = personById.get(state.focusId);
    if (!person) return;
    $('#treeTitle').textContent = privateName(person);
    $('#focusSummary').innerHTML = `<h3>${escapeHtml(privateName(person))}</h3><p>${parentsOf(person).length} progenitor${parentsOf(person).length === 1 ? '' : 'es'} · ${spousesOf(person).length} pareja${spousesOf(person).length === 1 ? '' : 's'} · ${childrenOf(person).length} hijo${childrenOf(person).length === 1 ? '' : 's'}</p>`;
  }
  function centerPerson(id, desiredScale) {
    const canvas = $('#treeCanvas');
    const pos = state.layout?.positions.get(id);
    if (!canvas || !pos) return;
    if (desiredScale) state.viewport.scale = desiredScale;
    state.viewport.x = canvas.clientWidth / 2 - (pos.x + pos.width / 2) * state.viewport.scale;
    state.viewport.y = canvas.clientHeight / 2 - (pos.y + pos.height / 2) * state.viewport.scale;
    applyViewport();
  }
  function fitTree() {
    const canvas = $('#treeCanvas');
    if (!canvas || !state.layout) return;
    const scale = Math.min((canvas.clientWidth - 30) / state.layout.width, (canvas.clientHeight - 30) / state.layout.height, 1);
    state.viewport.scale = Math.max(0.02, scale);
    state.viewport.x = (canvas.clientWidth - state.layout.width * state.viewport.scale) / 2;
    state.viewport.y = (canvas.clientHeight - state.layout.height * state.viewport.scale) / 2;
    applyViewport();
  }
  function zoomBy(factor, clientX, clientY) {
    const canvas = $('#treeCanvas');
    const rect = canvas.getBoundingClientRect();
    const px = (clientX ?? rect.left + rect.width / 2) - rect.left;
    const py = (clientY ?? rect.top + rect.height / 2) - rect.top;
    const oldScale = state.viewport.scale;
    const nextScale = Math.min(1.7, Math.max(0.02, oldScale * factor));
    const sceneX = (px - state.viewport.x) / oldScale;
    const sceneY = (py - state.viewport.y) / oldScale;
    state.viewport.scale = nextScale;
    state.viewport.x = px - sceneX * nextScale;
    state.viewport.y = py - sceneY * nextScale;
    applyViewport();
  }

  function personCard(person) {
    const issue = hasWarning(person) || isTraditional(person);
    const appearance = communityAppearance(person);
    const familyBackground = branchBackground(person);
    const cardStyle = `--community-bg:${appearance.color}${familyBackground ? `;--branch-bg:${familyBackground}` : ''}`;
    const communityAttributes = appearance.community ? ` data-community="${escapeHtml(appearance.community)}" title="Comunidad de nacimiento: ${escapeHtml(appearance.community)}"` : '';
    if (state.privacy) {
      return `<article class="person-card private-card ${sexClass(person)}" data-person="${person.id}" tabindex="0"${communityAttributes} style="${cardStyle}"><div class="person-card-top">${avatar(person)}</div><h3>${escapeHtml(privateName(person))}</h3><p>${escapeHtml(eventPlace(person, 'birth', true))}</p></article>`;
    }
    return `<article class="person-card ${sexClass(person)}" data-person="${person.id}" tabindex="0"${communityAttributes} style="${cardStyle}"><div class="person-card-top">${avatar(person)}<span class="tiny-label ${issue ? 'warning-label' : ''}">${isTraditional(person) ? 'Tradición' : issue ? 'Revisar' : (person.localPhoto ? 'Foto' : 'GED')}</span></div><h3>${escapeHtml(privateName(person))}</h3><p>${escapeHtml(lifeLabel(person))}<br>${escapeHtml(placeLabel(person))}</p>${provenanceMarkup(person)}</article>`;
  }
  function renderPeople() {
    const query = normalize(state.peopleQuery.trim());
    const filtered = people.filter((person) => {
      const haystack = normalize(`${person.name} ${person.birth?.place || ''} ${person.death?.place || ''} ${person.birthYear || ''}`);
      const filterMatch = state.peopleFilter === 'all' || (state.peopleFilter === 'photo' && person.localPhoto) || (state.peopleFilter === 'dated' && person.birth?.date) || (state.peopleFilter === 'review' && hasWarning(person));
      return filterMatch && (!query || haystack.includes(query));
    });
    $('#peopleGrid').innerHTML = filtered.length ? filtered.map(personCard).join('') : '<div class="empty-state">No hay coincidencias con esos filtros.</div>';
    bindPersonButtons($('#peopleGrid'));
  }
  function renderAudit() {
    const localEditCount = people.filter((person) => person.localEdit).length;
    const stats = [[tree.stats.individuals, 'personas en el GED'], [tree.stats.families, 'unidades familiares'], [tree.stats.knownBirthDates, 'nacimientos con fecha'], [tree.stats.knownDeathDates, 'defunciones con fecha'], [localEditCount, 'personas editadas localmente']];
    $('#statsGrid').innerHTML = stats.map(([value, label]) => `<div class="stat-card"><span class="stat-value">${value}</span><span class="stat-label">${label}</span></div>`).join('');
    $('#findingsList').innerHTML = research.findings.map((finding) => `<article class="finding ${finding.severity}"><span class="finding-bar"></span><div><h3>${escapeHtml(finding.title)}</h3><p>${escapeHtml(finding.summary)}</p><p class="recommendation"><strong>Siguiente paso:</strong> ${escapeHtml(finding.recommendation)}</p></div><span class="confidence">${finding.confidence}% confianza</span></article>`).join('');
    $('#auditPersonSelect').innerHTML = [...people].sort((a, b) => a.name.localeCompare(b.name, 'es')).map((person) => `<option value="${person.id}">${escapeHtml(person.name)}${person.localEdit ? ' · editado' : ''}</option>`).join('');
    $('#auditPersonSelect').value = state.focusId;
    $('#auditBadge').textContent = research.findings.filter((item) => item.severity !== 'info').length;
  }
  function renderSources() {
    $('#methodology').textContent = research.methodology;
    const statusLabels = { route: 'Ruta de archivo', context: 'Contexto', support: 'Apoyo' };
    const cards = research.sources.map((source) => `<article class="source-card"><div class="source-meta"><span>${escapeHtml(source.scope)}</span><span>${statusLabels[source.status] || source.status}</span></div><h2>${escapeHtml(source.title)}</h2><span class="publisher">${escapeHtml(source.publisher)}</span><p>${escapeHtml(source.assessment)}</p><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">Abrir fuente ↗</a></article>`);
    $('#sourceGrid').innerHTML = cards.join('');
  }

  function editValue(value) {
    return escapeHtml(value || '');
  }

  function openEditor(person) {
    const birth = person.birth || {};
    const death = person.death || {};
    $('#personDetail').innerHTML = `<form class="person-edit-form" id="personEditForm">
      <div class="edit-heading"><span class="eyebrow">Edición manual</span><h2>${escapeHtml(person.name)}</h2><p>Formato común para todas las personas. Los campos vacíos se mostrarán como «Sin registrar».</p></div>
      <div class="edit-grid identity-fields">
        <label><span>Nombre(s)</span><input name="given" value="${editValue(person.given)}" required></label>
        <label><span>Apellidos</span><input name="surname" value="${editValue(person.surname)}" required></label>
        <label><span>Sexo</span><select name="sex"><option value="M" ${person.sex === 'M' ? 'selected' : ''}>Hombre</option><option value="F" ${person.sex === 'F' ? 'selected' : ''}>Mujer</option><option value="U" ${!['M','F'].includes(person.sex) ? 'selected' : ''}>Sin registrar</option></select></label>
      </div>
      <fieldset><legend>Nacimiento</legend><div class="edit-grid">
        <label><span>Fecha</span><input name="birthDate" value="${editValue(birth.date)}" placeholder="DD/MM/AAAA o AAAA"></label>
        <label><span>Ciudad</span><input name="birthCity" value="${editValue(birth.city || birth.place)}"></label>
        <label><span>Comunidad autónoma</span><input name="birthRegion" value="${editValue(birth.region)}"></label>
        <label><span>País</span><input name="birthCountry" value="${editValue(birth.country || 'España')}"></label>
      </div></fieldset>
      <fieldset><legend>Defunción</legend><div class="edit-grid">
        <label><span>Fecha</span><input name="deathDate" value="${editValue(death.date)}" placeholder="DD/MM/AAAA o AAAA"></label>
        <label><span>Ciudad</span><input name="deathCity" value="${editValue(death.city || death.place)}"></label>
        <label><span>Comunidad autónoma</span><input name="deathRegion" value="${editValue(death.region)}"></label>
        <label><span>País</span><input name="deathCountry" value="${editValue(death.country || 'España')}"></label>
      </div></fieldset>
      <div class="edit-notice">Se guardará una corrección local asociada a ${escapeHtml(person.id)}. El archivo GED permanecerá intacto.</div>
      <div class="detail-actions"><button class="primary-button" type="submit">Guardar cambios</button><button class="ghost-button" type="button" data-cancel-edit>Cancelar</button></div>
    </form>`;
    if (!$('#personDialog').open) $('#personDialog').showModal();
    $('#personDetail [data-cancel-edit]').addEventListener('click', () => openDetail(person));
    $('#personEditForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const place = (prefix) => ({
        date: values[`${prefix}Date`].trim(), city: titleCase(values[`${prefix}City`]),
        region: titleCase(values[`${prefix}Region`]), country: titleCase(values[`${prefix}Country`]) || 'España'
      });
      const birthEdit = place('birth');
      const deathEdit = place('death');
      const extractYear = (date) => Number(String(date).match(/(\d{4})/)?.[1]) || null;
      person.given = titleCase(values.given);
      person.surname = titleCase(values.surname, true);
      person.name = `${person.given} ${person.surname}`.trim();
      person.sex = values.sex;
      person.birth = { ...(person.birth || {}), ...birthEdit, place: [birthEdit.city, birthEdit.region, birthEdit.country].filter(Boolean).join(', ') };
      person.death = [deathEdit.date, deathEdit.city, deathEdit.region].some(Boolean) ? { ...(person.death || {}), ...deathEdit, place: [deathEdit.city, deathEdit.region, deathEdit.country].filter(Boolean).join(', ') } : null;
      person.birthYear = extractYear(birthEdit.date);
      person.deathYear = extractYear(deathEdit.date);
      state.focusId = person.id;
      const edit = { given: person.given, surname: person.surname, sex: person.sex, birth: person.birth, death: person.death, birthYear: person.birthYear, deathYear: person.deathYear, updatedAt: new Date().toISOString() };
      person.localEdit = { updatedAt: edit.updatedAt };
      savedEdits[person.id] = edit;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedEdits)); } catch { /* El sitio sigue mostrando el cambio durante esta sesión. */ }
      renderTree();
      renderPeople();
      renderAudit();
      openDetail(person);
    });
  }

  function bindEditButtons(container) {
    container.querySelectorAll('[data-edit-person]').forEach((button) => button.addEventListener('click', (event) => {
      event.stopPropagation();
      openEditor(personById.get(button.dataset.editPerson));
    }));
  }

  function openDetail(person) {
    const hidden = state.privacy;
    const relatedIssues = issuesByPerson.get(person.id) || [];
    $('#personDetail').innerHTML = `<div class="detail-hero ${sexClass(person)}">${avatar(person)}<div><h2>${escapeHtml(privateName(person))}</h2><p>${escapeHtml(lifeLabel(person))}${person.localEdit ? ' · Editado localmente' : ''}</p></div></div><div class="detail-body"><div class="fact-list"><div class="fact"><small>Nacimiento</small><strong>${hidden ? 'Protegido' : escapeHtml(formatDate(person.birth?.date))}</strong></div><div class="fact"><small>Ubicación de nacimiento</small><strong>${escapeHtml(hidden ? 'Protegido' : eventPlace(person, 'birth'))}</strong></div><div class="fact"><small>Defunción</small><strong>${escapeHtml(hidden ? 'Protegido' : (person.death ? formatDate(person.death.date) : (person.inferredDeceased ? (person.inferredDeathReason === 'historical-band' ? 'Fallecimiento inferido por franja histórica (1920 o anterior)' : 'Fallecimiento inferido por edad (>100 años)') : 'Sin registrar')))}</strong></div><div class="fact"><small>Ubicación de defunción</small><strong>${escapeHtml(hidden ? 'Protegido' : eventPlace(person, 'death'))}</strong></div><div class="fact"><small>Familia</small><strong>${parentsOf(person).length} progenitor${parentsOf(person).length === 1 ? '' : 'es'} · ${spousesOf(person).length} pareja${spousesOf(person).length === 1 ? '' : 's'} · ${childrenOf(person).length} hijo${childrenOf(person).length === 1 ? '' : 's'}</strong></div></div>${hidden ? '' : provenanceMarkup(person)}${!hidden && isTraditional(person) ? `<div class="detail-warning"><strong>Tradición genealógica.</strong> Esta filiación no está confirmada por una fuente primaria medieval.</div>` : !hidden && relatedIssues.length ? `<div class="detail-warning"><strong>Dato por revisar.</strong> ${escapeHtml(relatedIssues[0].summary)}</div>` : ''}${connectedToRootIds.has(person.id) ? '' : `<div class="detail-warning"><strong>Sin vínculo familiar acreditado.</strong> Aparece separada en una franja estimada a partir de su actividad documentada en ${isolatedActivityYears.get(person.id)}; no es una fecha de nacimiento.</div>`}<div class="detail-actions"><button class="primary-button" data-edit-person="${person.id}">Editar datos</button><button class="ghost-button" data-focus-person="${person.id}">Centrar en el árbol</button></div></div>`;
    if (!$('#personDialog').open) $('#personDialog').showModal();
    $('#personDetail [data-focus-person]').addEventListener('click', () => { $('#personDialog').close(); switchView('tree'); revealPersonInTree(person.id); });
    bindEditButtons($('#personDetail'));
  }
  function bindPersonButtons(container) {
    container.querySelectorAll('[data-person]').forEach((element) => {
      element.addEventListener('click', () => openDetail(personById.get(element.dataset.person)));
      element.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDetail(personById.get(element.dataset.person)); } });
    });
  }
  function switchView(view) {
    $$('.view').forEach((section) => section.classList.toggle('is-active', section.id === `view-${view}`));
    $$('.tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.view === view));
    if (view === 'people') renderPeople();
    if (view === 'tree') requestAnimationFrame(applyViewport);
  }
  const searchPeople = (query) => people.filter((person) => normalize(person.name).includes(normalize(query))).slice(0, 8);

  $$('.tab').forEach((tab) => tab.addEventListener('click', () => switchView(tab.dataset.view)));
  $('#privacyToggle').addEventListener('change', (event) => { state.privacy = event.target.checked; renderTree(); renderPeople(); });
  const applyTreeFilters = () => {
    renderTree({ preserveView: false });
    const branch = familyBranches.find((item) => item.key === state.treeBranch);
    if (branch && state.visibleIds.has(branch.rootId)) {
      state.focusId = branch.rootId;
      renderTree({ preserveView: false });
    }
    $('#nearFamily').classList.toggle('is-active', state.treeBranch === 'all' && state.treeGenerations === '2' && !state.directOnly);
    $('#resetTreeFilters').classList.toggle('is-active', state.treeBranch === 'all' && state.treeGenerations === 'all' && !state.directOnly);
  };
  function selectTreePreset(generations) {
    state.treeBranch = 'all';
    state.treeGenerations = generations;
    state.directOnly = false;
    state.focusId = '@I500001@';
    $('#treeBranchFilter').value = 'all';
    $('#treeGenerationFilter').value = generations;
    $('#treeDirectOnly').checked = false;
    applyTreeFilters();
  }
  $('#nearFamily').addEventListener('click', () => selectTreePreset('2'));
  $('#resetTreeFilters').addEventListener('click', () => selectTreePreset('all'));
  $('#readableZoom').addEventListener('click', () => centerPerson(state.focusId, 0.9));
  $('#expandTree').addEventListener('click', () => {
    const expanded = $('#view-tree').classList.toggle('tree-expanded');
    $('#expandTree').setAttribute('aria-pressed', String(expanded));
    $('#expandTree').textContent = expanded ? 'Salir de ampliado' : 'Ampliar lienzo';
    requestAnimationFrame(() => centerPerson(state.focusId, state.viewport.scale));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !$('#personDialog').open && $('#view-tree').classList.contains('tree-expanded')) $('#expandTree').click();
  });
  function revealPersonInTree(id) {
    if (!state.visibleIds.has(id)) {
      state.treeBranch = 'all';
      state.treeGenerations = 'all';
      state.directOnly = false;
      $('#treeBranchFilter').value = 'all';
      $('#treeGenerationFilter').value = 'all';
      $('#treeDirectOnly').checked = false;
    }
    state.focusId = id;
    renderTree();
    requestAnimationFrame(() => centerPerson(id, Math.max(0.72, state.viewport.scale)));
  }
  $('#treeBranchFilter').addEventListener('change', (event) => { state.treeBranch = event.target.value; applyTreeFilters(); });
  $('#treeGenerationFilter').addEventListener('change', (event) => { state.treeGenerations = event.target.value; applyTreeFilters(); });
  $('#treeDirectOnly').addEventListener('change', (event) => { state.directOnly = event.target.checked; applyTreeFilters(); });
  $('#personSearch').addEventListener('input', (event) => {
    const query = event.target.value.trim();
    const box = $('#searchResults');
    if (!query) { box.hidden = true; return; }
    const results = searchPeople(query);
    box.innerHTML = results.length ? results.map((person) => `<button class="search-result" data-search-person="${person.id}">${avatar(person)}<span><strong>${escapeHtml(privateName(person))}</strong><small>${escapeHtml(lifeLabel(person))}</small></span></button>`).join('') : '<div class="search-result">Sin coincidencias</div>';
    box.hidden = false;
    box.querySelectorAll('[data-search-person]').forEach((button) => button.addEventListener('click', () => { event.target.value = ''; box.hidden = true; revealPersonInTree(button.dataset.searchPerson); }));
  });
  document.addEventListener('click', (event) => { if (!event.target.closest('.search-wrap')) $('#searchResults').hidden = true; });
  $('#peopleSearch').addEventListener('input', (event) => { state.peopleQuery = event.target.value; renderPeople(); });
  $$('#peopleFilters .chip').forEach((button) => button.addEventListener('click', () => { state.peopleFilter = button.dataset.filter; $$('#peopleFilters .chip').forEach((chip) => chip.classList.toggle('is-active', chip === button)); renderPeople(); }));
  $('#homePerson').addEventListener('click', () => { state.focusId = '@I500001@'; renderTree(); requestAnimationFrame(() => centerPerson(state.focusId, 0.9)); });
  $('#fitTree').addEventListener('click', fitTree);
  $('#zoomIn').addEventListener('click', () => zoomBy(1.2));
  $('#zoomOut').addEventListener('click', () => zoomBy(1 / 1.2));
  $('#editSelectedPerson').addEventListener('click', () => openEditor(personById.get($('#auditPersonSelect').value)));
  $('#sidebarToggle').addEventListener('click', () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    $('#view-tree').classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
    $('#sidebarToggle').setAttribute('aria-expanded', String(!state.sidebarCollapsed));
    $('#sidebarToggle').setAttribute('aria-label', state.sidebarCollapsed ? 'Mostrar explorador' : 'Ocultar explorador');
    $('#sidebarToggle').textContent = state.sidebarCollapsed ? '›' : '‹';
  });
  const canvas = $('#treeCanvas');
  canvas.addEventListener('wheel', (event) => { event.preventDefault(); zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12, event.clientX, event.clientY); }, { passive: false });

  const pointers = new Map();
  let pinch = null;
  const dragState = (pointer) => ({ startX: pointer.x, startY: pointer.y, x: state.viewport.x, y: state.viewport.y });

  canvas.addEventListener('pointerdown', (event) => {
    if (event.target.closest('[data-person]')) return;
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      state.drag = dragState([...pointers.values()][0]);
      canvas.classList.add('is-dragging');
    } else if (pointers.size === 2) {
      state.drag = null;
      canvas.classList.remove('is-dragging');
      const [a, b] = [...pointers.values()];
      const rect = canvas.getBoundingClientRect();
      const midX = (a.x + b.x) / 2 - rect.left;
      const midY = (a.y + b.y) / 2 - rect.top;
      pinch = {
        startDistance: Math.hypot(b.x - a.x, b.y - a.y),
        startScale: state.viewport.scale,
        sceneX: (midX - state.viewport.x) / state.viewport.scale,
        sceneY: (midY - state.viewport.y) / state.viewport.scale,
      };
    }
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1 && state.drag) {
      const [pointer] = [...pointers.values()];
      state.viewport.x = state.drag.x + pointer.x - state.drag.startX;
      state.viewport.y = state.drag.y + pointer.y - state.drag.startY;
      applyViewport();
    } else if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()];
      const rect = canvas.getBoundingClientRect();
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const scale = Math.min(1.7, Math.max(0.02, pinch.startScale * (distance / pinch.startDistance)));
      const midX = (a.x + b.x) / 2 - rect.left;
      const midY = (a.y + b.y) / 2 - rect.top;
      state.viewport.scale = scale;
      state.viewport.x = midX - pinch.sceneX * scale;
      state.viewport.y = midY - pinch.sceneY * scale;
      applyViewport();
    }
  });

  const endPointer = (event) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) {
      state.drag = null;
      canvas.classList.remove('is-dragging');
    } else if (pointers.size === 1) {
      state.drag = dragState([...pointers.values()][0]);
      canvas.classList.add('is-dragging');
    }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('keydown', (event) => {
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomBy(1.2); }
    if (event.key === '-') { event.preventDefault(); zoomBy(1 / 1.2); }
    if (event.key === '0') { event.preventDefault(); fitTree(); }
    const directions = { ArrowLeft: [100, 0], ArrowRight: [-100, 0], ArrowUp: [0, 100], ArrowDown: [0, -100] };
    if (directions[event.key]) {
      event.preventDefault();
      state.viewport.x += directions[event.key][0];
      state.viewport.y += directions[event.key][1];
      applyViewport();
    }
  });
  $('.dialog-close').addEventListener('click', () => $('#personDialog').close());
  $('#personDialog').addEventListener('click', (event) => { if (event.target === $('#personDialog')) $('#personDialog').close(); });
  window.addEventListener('resize', () => { if ($('#view-tree').classList.contains('is-active')) applyViewport(); });

  $$('.person-count').forEach((element) => { element.textContent = tree.stats.individuals; });
  const headerObserver = new ResizeObserver(() => {
    document.documentElement.style.setProperty('--header-height', `${$('.topbar').getBoundingClientRect().height}px`);
  });
  headerObserver.observe($('.topbar'));
  $('#view-tree').classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
  $('#sidebarToggle').setAttribute('aria-expanded', String(!state.sidebarCollapsed));
  $('#sidebarToggle').setAttribute('aria-label', state.sidebarCollapsed ? 'Mostrar explorador' : 'Ocultar explorador');
  $('#sidebarToggle').textContent = state.sidebarCollapsed ? '›' : '‹';
  $('#resetTreeFilters').classList.add('is-active');
  renderTree({ preserveView: false });
  renderPeople();
  renderAudit();
  renderSources();
})();
