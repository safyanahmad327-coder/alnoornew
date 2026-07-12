export interface Dua {
  id: string;
  category: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference?: string;
}

export const DUA_CATEGORIES = [
  "Daily",
  "Morning & Evening",
  "Food & Drink",
  "Home",
  "Travel",
  "Sleep",
  "Distress",
  "Forgiveness",
] as const;

export const DUAS: Dua[] = [
  {
    id: "wake",
    category: "Daily",
    title: "Upon waking up",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    transliteration: "Alhamdulillāhil-ladhī aḥyānā baʿda mā amātanā wa ilayhin-nushūr",
    translation:
      "All praise is for Allah who gave us life after causing us to die, and to Him is the resurrection.",
    reference: "Bukhari 6312",
  },
  {
    id: "enter-masjid",
    category: "Daily",
    title: "Entering the masjid",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration: "Allāhummaftaḥ lī abwāba raḥmatik",
    translation: "O Allah, open the doors of Your mercy for me.",
    reference: "Muslim 713",
  },
  {
    id: "leave-masjid",
    category: "Daily",
    title: "Leaving the masjid",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    transliteration: "Allāhumma innī asʾaluka min faḍlik",
    translation: "O Allah, I ask You from Your bounty.",
    reference: "Muslim 713",
  },
  {
    id: "morning",
    category: "Morning & Evening",
    title: "Morning remembrance",
    arabic:
      "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    transliteration:
      "Aṣbaḥnā wa aṣbaḥal-mulku lillāh, walḥamdu lillāh, lā ilāha illallāhu waḥdahu lā sharīka lah",
    translation:
      "We have reached the morning and the kingdom belongs to Allah. All praise is for Allah. There is no god but Allah, alone, with no partner.",
    reference: "Muslim 2723",
  },
  {
    id: "evening",
    category: "Morning & Evening",
    title: "Evening remembrance",
    arabic:
      "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    transliteration:
      "Amsaynā wa amsal-mulku lillāh, walḥamdu lillāh, lā ilāha illallāhu waḥdahu lā sharīka lah",
    translation:
      "We have reached the evening and the kingdom belongs to Allah. All praise is for Allah. There is no god but Allah, alone, with no partner.",
    reference: "Muslim 2723",
  },
  {
    id: "sayyidul-istighfar",
    category: "Morning & Evening",
    title: "Sayyid al-Istighfar",
    arabic:
      "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ",
    transliteration:
      "Allāhumma anta Rabbī lā ilāha illā ant, khalaqtanī wa anā ʿabduk, wa anā ʿalā ʿahdika wa waʿdika mastaṭaʿt",
    translation:
      "O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can.",
    reference: "Bukhari 6306",
  },
  {
    id: "before-eating",
    category: "Food & Drink",
    title: "Before eating",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillāh",
    translation: "In the name of Allah.",
    reference: "Abu Dawud 3767",
  },
  {
    id: "forget-bismillah",
    category: "Food & Drink",
    title: "If you forgot to say Bismillah",
    arabic: "بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ",
    transliteration: "Bismillāhi fī awwalihi wa ākhirih",
    translation: "In the name of Allah at its beginning and end.",
    reference: "Tirmidhi 1858",
  },
  {
    id: "after-eating",
    category: "Food & Drink",
    title: "After eating",
    arabic:
      "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
    transliteration:
      "Alhamdulillāhil-ladhī aṭʿamanī hādhā wa razaqanīhi min ghayri ḥawlin minnī wa lā quwwah",
    translation:
      "All praise is for Allah who fed me this and provided it for me, without any might or power on my part.",
    reference: "Abu Dawud 4023",
  },
  {
    id: "enter-home",
    category: "Home",
    title: "Entering the home",
    arabic:
      "بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
    transliteration:
      "Bismillāhi walajnā, wa bismillāhi kharajnā, wa ʿalallāhi Rabbinā tawakkalnā",
    translation:
      "In the name of Allah we enter, in the name of Allah we leave, and upon Allah our Lord we rely.",
    reference: "Abu Dawud 5096",
  },
  {
    id: "leave-home",
    category: "Home",
    title: "Leaving the home",
    arabic: "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration:
      "Bismillāh, tawakkaltu ʿalallāh, wa lā ḥawla wa lā quwwata illā billāh",
    translation:
      "In the name of Allah, I place my trust in Allah, and there is no might or power except with Allah.",
    reference: "Abu Dawud 5095",
  },
  {
    id: "travel",
    category: "Travel",
    title: "Beginning a journey",
    arabic:
      "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ",
    transliteration:
      "Subḥānal-ladhī sakhkhara lanā hādhā wa mā kunnā lahu muqrinīn, wa innā ilā Rabbinā lamunqalibūn",
    translation:
      "Glory be to the One who has subjected this to us, and we could never have accomplished it by ourselves. And indeed, to our Lord we shall return.",
    reference: "Muslim 1342",
  },
  {
    id: "sleep",
    category: "Sleep",
    title: "Before sleeping",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allāhumma amūtu wa aḥyā",
    translation: "In Your name, O Allah, I die and I live.",
    reference: "Bukhari 6324",
  },
  {
    id: "distress-1",
    category: "Distress",
    title: "In times of distress",
    arabic:
      "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ",
    transliteration:
      "Lā ilāha illallāhul-ʿAẓīmul-Ḥalīm, lā ilāha illallāhu Rabbul-ʿArshil-ʿAẓīm",
    translation:
      "There is no god but Allah, the Mighty, the Forbearing. There is no god but Allah, Lord of the Mighty Throne.",
    reference: "Bukhari 6346",
  },
  {
    id: "distress-2",
    category: "Distress",
    title: "Anxiety and sorrow",
    arabic:
      "اللَّهُمَّ إِنِّي عَبْدُكَ، ابْنُ عَبْدِكَ، ابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ",
    transliteration:
      "Allāhumma innī ʿabduka, ibnu ʿabdika, ibnu amatika, nāṣiyatī biyadika, māḍin fiyya ḥukmuka, ʿadlun fiyya qaḍāʾuk",
    translation:
      "O Allah, I am Your servant, son of Your servant, son of Your maidservant. My forelock is in Your hand, Your command over me is forever executed and Your decree over me is just.",
    reference: "Ahmad 3712",
  },
  {
    id: "forgive-1",
    category: "Forgiveness",
    title: "Seeking forgiveness",
    arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
    transliteration: "Astaghfirullāha wa atūbu ilayh",
    translation: "I seek Allah's forgiveness and turn to Him in repentance.",
  },
  {
    id: "forgive-2",
    category: "Forgiveness",
    title: "Comprehensive forgiveness",
    arabic:
      "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration:
      "Rabbanā ātinā fid-dunyā ḥasanatan wa fil-ākhirati ḥasanatan wa qinā ʿadhāban-nār",
    translation:
      "Our Lord, give us in this world good and in the Hereafter good and protect us from the punishment of the Fire.",
    reference: "Qur'an 2:201",
  },
];
