const patchedTransitives = {
  postcss: () => "8.5.10",
  minimatch: (range) => (String(range).includes("9") ? "9.0.7" : "3.1.4"),
  "brace-expansion": (range) => (String(range).includes("2") ? "2.0.3" : "1.1.13"),
  picomatch: (range) => (String(range).includes("4") ? "4.0.4" : "2.3.2"),
  flatted: () => "3.4.2",
};

function patchDependencyMap(dependencies) {
  if (!dependencies) {
    return;
  }

  for (const [name, getVersion] of Object.entries(patchedTransitives)) {
    if (dependencies[name]) {
      dependencies[name] = getVersion(dependencies[name]);
    }
  }
}

module.exports = {
  hooks: {
    readPackage(pkg) {
      patchDependencyMap(pkg.dependencies);
      patchDependencyMap(pkg.optionalDependencies);
      return pkg;
    },
  },
};
