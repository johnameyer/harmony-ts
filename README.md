<h1 align="center">harmony-ts</h1>
<div align="center">

[![Documentation](https://img.shields.io/static/v1?label=docs&message=hosted&color=informational&logo=typescript)](johnameyer.github.io/harmony-ts)
[![Github CI](https://img.shields.io/github/workflow/status/johnameyer/harmony-ts/CI?logo=github)](https://github.com/johnameyer/harmony-ts/actions)
[![npm version](https://img.shields.io/npm/v/harmony-ts?logo=npm)](https://badge.fury.io/js/harmony-ts)
![GitHub Last Commit](https://img.shields.io/github/last-commit/johnameyer/harmony-ts?logo=github)
[![Typescript](https://img.shields.io/github/languages/top/johnameyer/harmony-ts?logo=typescript)]()
[![Dependencies](https://img.shields.io/david/johnameyer/harmony-ts?logo=npm)]()
</div>

This project is an engine for generating and analyzing four-part textures (and eventually other forms) in the style of Bach and the classical era. Currently, it allows one to pass a series of constraints, such as chord/type/inversion and voice parts, and it will produce the complete texture using the settings provided. It also gives many useful basic music theory functions like intervals and chords.

## Getting Started

### Installing

```
npm install harmony-ts
```

### Using the Library

To use the harmonizer, first set up the constraints you wish to use. This might consist of particular notes or a [roman numeral](https://en.wikipedia.org/wiki/Roman_numeral_analysis) in a scale. The incomplete chord struct is meant to represent a vertical slice and single chord that is to be harmonized.
```
const sopranoNotes = ['E5', 'E5', 'D5', 'D5', 'C5', 'C5', 'B4', 'C5'];
const constraints = sopranoNotes.map(soprano => new IncompleteChord({voices: [soprano, undefined, undefined, undefined]}));
```

Then select the scale to harmonize within and pass the constraints to the harmonizer.
```
const scale = Scale.Major.notes;
const params: HarmonyParameters = { scale, constraints };
const result = Harmony.harmonizeAll(params);
```

### Code Examples

[Library Demo](https://johnameyer.github.io/harmony-ts-demo)
[Unit Tests](https://github.com/search?q=repo%3Ajohnameyer%2Fharmony-ts+path%3Asrc+filename%3Atest.ts+language%3ATypeScript&type=Code&ref=advsearch&l=TypeScript)
[Package Import Tests](https://github.com/johnameyer/harmony-ts/tree/master/test)

### Documentation

[Typedoc](johnameyer.github.io/harmony-ts)

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/johnameyer/harmony-ts/tags). 

## Authors

* **John Meyer** - *Initial work* - [johnameyer](https://github.com/johnameyer)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.