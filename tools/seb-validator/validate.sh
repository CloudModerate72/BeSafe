#!/usr/bin/env bash
# Prüft .seb-Dateien mit den Original-Klassen aus dem Quellcode von SEB für Windows
# (XmlParser, DataValidator, DataMapper, DataProcessor, SimplifiedRule, RequestFilter).
# Benötigt: git und .NET SDK 8 (Linux, macOS oder Windows mit Git Bash).
#
#   tools/seb-validator/validate.sh Probepruefung.seb Probepruefung_lokal.seb
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="${SEB_VALIDATOR_WORK:-$HERE/.work}"
SEB="$WORK/seb-win-refactoring"

if [ ! -d "$SEB/.git" ]; then
  mkdir -p "$WORK"
  git clone --depth 1 https://github.com/SafeExamBrowser/seb-win-refactoring "$SEB"
fi

echo "SEB-Quellcode: $(git -C "$SEB" log -1 --format='%h %cd' --date=short)"

# Module.GetSignerCertificate() gibt es nur im .NET Framework. Die Methode, die es aufruft
# (InitializeAppConfig), wird beim Laden einer Konfiguration nicht benutzt.
sed 's|var certificate = executable.Modules.First().GetSignerCertificate();|System.Security.Cryptography.X509Certificates.X509Certificate certificate = null;|' \
  "$SEB/SafeExamBrowser.Configuration/ConfigurationData/DataValues.cs" > "$WORK/DataValues.patched.cs"

cat > "$WORK/SebValidator.csproj" <<EOF
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>disable</Nullable>
    <ImplicitUsings>disable</ImplicitUsings>
    <NoWarn>CS0618;SYSLIB0021;SYSLIB0001;CS8632;CA1416</NoWarn>
    <EnableDefaultItems>false</EnableDefaultItems>
  </PropertyGroup>
  <ItemGroup>
    <Compile Include="$HERE/Program.cs" />
    <Compile Include="$WORK/DataValues.patched.cs" />
    <Compile Include="$SEB/SafeExamBrowser.Settings/**/*.cs" Exclude="$SEB/SafeExamBrowser.Settings/Properties/**" />
    <Compile Include="$SEB/SafeExamBrowser.Configuration.Contracts/**/*.cs" Exclude="$SEB/SafeExamBrowser.Configuration.Contracts/Properties/**" />
    <Compile Include="$SEB/SafeExamBrowser.Logging.Contracts/**/*.cs" Exclude="$SEB/SafeExamBrowser.Logging.Contracts/Properties/**" />
    <Compile Include="$SEB/SafeExamBrowser.Integrity.Contracts/**/*.cs" Exclude="$SEB/SafeExamBrowser.Integrity.Contracts/Properties/**;$SEB/SafeExamBrowser.Integrity.Contracts/IVerificator.cs" />
    <Compile Include="$SEB/SafeExamBrowser.Configuration/ConfigurationData/**/*.cs" Exclude="$SEB/SafeExamBrowser.Configuration/ConfigurationData/DataValues.cs" />
    <Compile Include="$SEB/SafeExamBrowser.Configuration/DataFormats/XmlParser.cs" />
    <Compile Include="$SEB/SafeExamBrowser.Configuration/DataFormats/XmlElement.cs" />
    <Compile Include="$SEB/SafeExamBrowser.Configuration/DataCompression/GZipCompressor.cs" />
    <Compile Include="$SEB/SafeExamBrowser.Configuration/Cryptography/HashAlgorithm.cs" />
    <Compile Include="$SEB/SafeExamBrowser.Browser.Contracts/Filters/**/*.cs" />
    <Compile Include="$SEB/SafeExamBrowser.Browser/Filters/Rules/*.cs" />
    <Compile Include="$SEB/SafeExamBrowser.Browser/Filters/RequestFilter.cs" />
    <Compile Include="$SEB/SafeExamBrowser.Browser/Filters/RuleFactory.cs" />
  </ItemGroup>
</Project>
EOF

dotnet build "$WORK/SebValidator.csproj" -nologo -v q -o "$WORK/bin" > "$WORK/build.log" || { cat "$WORK/build.log"; exit 1; }

status=0
for file in "$@"; do
  dotnet "$WORK/bin/SebValidator.dll" "$file" || status=1
  echo
done
exit $status
