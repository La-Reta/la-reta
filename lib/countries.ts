/**
 * ISO 3166-1 alpha-2 country codes (lowercase), used by the country picker.
 * Names are resolved at runtime with `Intl.DisplayNames` so we don't ship a
 * translated name table; flags come from `flagEmoji`.
 */
export const COUNTRY_CODES = [
  "ad", "ae", "af", "ag", "ai", "al", "am", "ao", "ar", "at", "au", "aw", "az",
  "ba", "bb", "bd", "be", "bf", "bg", "bh", "bi", "bj", "bn", "bo", "br", "bs",
  "bt", "bw", "by", "bz", "ca", "cd", "cf", "cg", "ch", "ci", "cl", "cm", "cn",
  "co", "cr", "cu", "cv", "cw", "cy", "cz", "de", "dj", "dk", "dm", "do", "dz",
  "ec", "ee", "eg", "er", "es", "et", "fi", "fj", "fm", "fo", "fr", "ga", "gb",
  "gd", "ge", "gf", "gg", "gh", "gi", "gl", "gm", "gn", "gp", "gq", "gr", "gt",
  "gu", "gw", "gy", "hk", "hn", "hr", "ht", "hu", "id", "ie", "il", "im", "in",
  "iq", "ir", "is", "it", "je", "jm", "jo", "jp", "ke", "kg", "kh", "ki", "km",
  "kn", "kp", "kr", "kw", "ky", "kz", "la", "lb", "lc", "li", "lk", "lr", "ls",
  "lt", "lu", "lv", "ly", "ma", "mc", "md", "me", "mg", "mh", "mk", "ml", "mm",
  "mn", "mo", "mq", "mr", "mt", "mu", "mv", "mw", "mx", "my", "mz", "na", "nc",
  "ne", "ng", "ni", "nl", "no", "np", "nr", "nz", "om", "pa", "pe", "pf", "pg",
  "ph", "pk", "pl", "pr", "ps", "pt", "pw", "py", "qa", "re", "ro", "rs", "ru",
  "rw", "sa", "sb", "sc", "sd", "se", "sg", "si", "sk", "sl", "sm", "sn", "so",
  "sr", "ss", "st", "sv", "sy", "sz", "td", "tg", "th", "tj", "tl", "tm", "tn",
  "to", "tr", "tt", "tv", "tw", "tz", "ua", "ug", "us", "uy", "uz", "va", "vc",
  "ve", "vn", "vu", "ws", "ye", "za", "zm", "zw",
] as const;
