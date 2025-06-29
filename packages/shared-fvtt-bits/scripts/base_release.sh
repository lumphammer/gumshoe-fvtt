red() {
  echo -e "\033[31m$1\033[0m"
}

green() {
  echo -e "\033[32m$1\033[0m"
}

##############################################################################
# do a release
#
# $1: tag prefix (e.g. "v" or "prerelease-v")
#
base_release() {
  tag_prefix=$1

  ##############################################################################
  # read the versions from the fvtt manifest and package.json and ensure they
  # are the same
  if [ -e public/system.json ]; then
    manifest=public/system.json
  elif [ -e public/module.json ]; then
    manifest=public/module.json
  fi
  manifestVersion=$(jq .version "$manifest" -r)

  packageJsonVersion=$(jq .version package.json -r)

  if [ "$packageJsonVersion" != "$manifestVersion" ]; then
    red "package.json and $manifest have different versions"
    echo "package.json: $packageJsonVersion"
    echo "$manifest: $manifestVersion"
    exit 1
  fi

  ##############################################################################
  # ensure version is `generation.increment`
  if ! [[ "$manifestVersion" =~ ^[0-9]+\.[0-9]+$ ]]; then
    red "Invalid version: $manifestVersion"
    echo "Version must be of the form X.Y where X and Y are simple integers."
    echo "Please update the version in $manifest and package.json."
    exit 1
  fi

  ##############################################################################
  # commit, tag, and push the release
  tag=$tag_prefix$manifestVersion

  green "Tagging $tag\n"

  git commit -am $tag --allow-empty
  git push
  git tag $tag
  git push origin $tag
}
