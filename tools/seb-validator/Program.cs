// Testlauf: lädt eine .seb-Datei mit den Original-Klassen von SEB für Windows
// (gleiche Reihenfolge wie ConfigurationRepository.TryLoadSettings) und prüft den URL-Filter
// wie RequestResponsibility.InitializeRequestFilter / RequestHandler.
using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using SafeExamBrowser.Browser.Contracts.Filters;
using SafeExamBrowser.Browser.Filters;
using SafeExamBrowser.Configuration.ConfigurationData;
using SafeExamBrowser.Configuration.Contracts;
using SafeExamBrowser.Configuration.Cryptography;
using SafeExamBrowser.Configuration.DataCompression;
using SafeExamBrowser.Configuration.DataFormats;
using SafeExamBrowser.Logging.Contracts;
using SafeExamBrowser.Settings;
using SafeExamBrowser.Settings.Logging;
using SafeExamBrowser.Settings.Browser.Filter;

class ConsoleLogger : ILogger
{
	public LogLevel LogLevel { get; set; }
	public void Debug(string m) { }
	public void Info(string m) { Console.WriteLine("  [info]  " + m); }
	public void Warn(string m) { Console.WriteLine("  [WARN]  " + m); }
	public void Error(string m) { Console.WriteLine("  [ERROR] " + m); }
	public void Error(string m, Exception e) { Console.WriteLine("  [ERROR] " + m + " " + e); }
	public void Log(string m) { }
	public void Subscribe(ILogObserver o) { }
	public void Unsubscribe(ILogObserver o) { }
	public IList<ILogContent> GetLog() { return new List<ILogContent>(); }
	public ILogger CloneFor(string s) { return this; }
}

class Program
{
	static int failures;

	static void Check(string name, bool ok, object actual)
	{
		Console.WriteLine($"  {(ok ? "OK  " : "FAIL")} {name} = {actual}");
		if (!ok) failures++;
	}

	static int Main(string[] args)
	{
		var file = args[0];
		var logger = new ConsoleLogger();
		var compressor = new GZipCompressor(logger);
		var parser = new XmlParser(compressor, logger);
		var values = new DataValues();
		var mapper = new DataMapper();
		var processor = new DataProcessor();
		var validator = new DataValidator(logger);

		Console.WriteLine($"== {Path.GetFileName(file)}");

		var settings = values.LoadDefaultSettings();
		processor.ProcessDefault(settings);

		using (var stream = new MemoryStream(File.ReadAllBytes(file)))
		{
			Check("XmlParser.CanParse", parser.CanParse(stream), parser.CanParse(stream));
			var result = parser.TryParse(stream);
			Check("XmlParser.TryParse", result.Status == LoadStatus.Success, result.Status);
			if (result.Status != LoadStatus.Success) return 1;
			Console.WriteLine($"  raw keys parsed: {result.RawData.Count}");
			Check("DataValidator.Validate", validator.Validate(result.RawData), true);
			mapper.Map(result.RawData, settings);
			processor.Process(result.RawData, settings);
		}

		var b = settings.Browser;
		var s = settings.Security;
		var hash = new HashAlgorithm();
		var quitPassword = args.Length > 1 ? args[1] : "Probe2026";

		Console.WriteLine("-- gemappte Einstellungen");
		Check("ConfigurationMode", settings.ConfigurationMode == ConfigurationMode.Exam, settings.ConfigurationMode);
		Check("Browser.StartUrl", b.StartUrl.StartsWith("http"), b.StartUrl);
		Check("Browser.QuitUrl", b.QuitUrl.EndsWith("/beenden.html"), b.QuitUrl);
		Check("Browser.ConfirmQuitUrl", b.ConfirmQuitUrl, b.ConfirmQuitUrl);
		Check("MainWindow.FullScreenMode", b.MainWindow.FullScreenMode, b.MainWindow.FullScreenMode);
		Check("MainWindow.ShowToolbar", !b.MainWindow.ShowToolbar, b.MainWindow.ShowToolbar);
		Check("MainWindow.AllowAddressBar", !b.MainWindow.AllowAddressBar, b.MainWindow.AllowAddressBar);
		Check("MainWindow.AllowBackwardNavigation", !b.MainWindow.AllowBackwardNavigation, b.MainWindow.AllowBackwardNavigation);
		Check("MainWindow.AllowForwardNavigation", !b.MainWindow.AllowForwardNavigation, b.MainWindow.AllowForwardNavigation);
		Check("MainWindow.AllowDeveloperConsole", !b.MainWindow.AllowDeveloperConsole, b.MainWindow.AllowDeveloperConsole);
		Check("Browser.PopupPolicy", b.PopupPolicy.ToString() == "Block", b.PopupPolicy);
		Check("Browser.AllowDownloads", !b.AllowDownloads, b.AllowDownloads);
		Check("Browser.AllowUploads", !b.AllowUploads, b.AllowUploads);
		Check("Browser.AllowConfigurationDownloads", !b.AllowConfigurationDownloads, b.AllowConfigurationDownloads);
		Check("Browser.AllowFind", !b.AllowFind, b.AllowFind);
		Check("Browser.AllowPrint", !b.AllowPrint, b.AllowPrint);
		Check("Browser.AllowSpellChecking", !b.AllowSpellChecking, b.AllowSpellChecking);
		Check("Filter.ProcessMainRequests", b.Filter.ProcessMainRequests, b.Filter.ProcessMainRequests);
		Check("Filter.Rules.Count", b.Filter.Rules.Count == 1, b.Filter.Rules.Count);
		Check("Security.AllowTermination", s.AllowTermination, s.AllowTermination);
		Check("Security.QuitPasswordHash == SHA256(\"" + quitPassword + "\")", s.QuitPasswordHash.Equals(hash.GenerateHashFor(quitPassword), StringComparison.OrdinalIgnoreCase), s.QuitPasswordHash);
		Check("Security.ClipboardPolicy", s.ClipboardPolicy.ToString() == "Isolated", s.ClipboardPolicy);
		Check("Security.KioskMode", s.KioskMode.ToString() == "CreateNewDesktop", s.KioskMode);
		Check("Security.VirtualMachinePolicy", s.VirtualMachinePolicy.ToString() == "Deny", s.VirtualMachinePolicy);
		Check("Security.AllowWindowCapture", !s.AllowWindowCapture, s.AllowWindowCapture);
		Check("Keyboard.AllowAltTab", !settings.Keyboard.AllowAltTab, settings.Keyboard.AllowAltTab);
		Check("Keyboard.AllowAltF4", !settings.Keyboard.AllowAltF4, settings.Keyboard.AllowAltF4);
		Check("Keyboard.AllowPrintScreen", !settings.Keyboard.AllowPrintScreen, settings.Keyboard.AllowPrintScreen);
		Check("Keyboard.AllowSystemKey", !settings.Keyboard.AllowSystemKey, settings.Keyboard.AllowSystemKey);
		Check("Mouse.AllowRightButton", !settings.Mouse.AllowRightButton, settings.Mouse.AllowRightButton);
		Check("Taskbar.EnableTaskbar", settings.UserInterface.Taskbar.EnableTaskbar, settings.UserInterface.Taskbar.EnableTaskbar);
		Console.WriteLine($"  info Service.Policy = {settings.Service.Policy}, Service.IgnoreService = {settings.Service.IgnoreService}");

		Console.WriteLine("-- URL-Filter (Original SimplifiedRule/RequestFilter)");
		var factory = new RuleFactory();
		var filter = new RequestFilter();
		foreach (var r in b.Filter.Rules)
		{
			var rule = factory.CreateRule(r.Type);
			rule.Initialize(r);
			filter.Load(rule);
		}
		Check("StartUrl ohne Auto-Regel erlaubt", filter.Process(new Request { Url = b.StartUrl }) == FilterResult.Allow, b.StartUrl);

		var baseUri = new Uri(b.StartUrl);
		string[] allowed = { b.StartUrl, new Uri(baseUri, "index.html").ToString(), new Uri(baseUri, "beenden.html").ToString() };
		var blocked = new List<string> { "https://www.google.com/", "https://de.wikipedia.org/wiki/Pythagoras", "https://chatgpt.com/" };
		if (baseUri.AbsolutePath != "/")
		{
			blocked.Add($"{baseUri.Scheme}://{baseUri.Authority}/anderes-projekt/");
		}
		foreach (var u in allowed) Check("erlaubt: " + u, filter.Process(new Request { Url = u }) == FilterResult.Allow, filter.Process(new Request { Url = u }));
		foreach (var u in blocked) Check("blockiert: " + u, filter.Process(new Request { Url = u }) == FilterResult.Block, filter.Process(new Request { Url = u }));

		Console.WriteLine("-- quitURL-Erkennung (Muster aus RequestHandler.IsQuitUrl)");
		var pattern = $"^{Regex.Escape(b.QuitUrl.TrimEnd('/'))}/?$";
		var jsQuitUrl = new Uri(baseUri, "beenden.html").ToString(); // = new URL("beenden.html", location.href) in script.js
		Check("quitURL erkannt: " + jsQuitUrl, Regex.IsMatch(jsQuitUrl, pattern, RegexOptions.IgnoreCase), true);
		Check("Start-URL ist keine quitURL", !Regex.IsMatch(b.StartUrl, pattern, RegexOptions.IgnoreCase), false);

		Console.WriteLine(failures == 0 ? "ERGEBNIS: alle Prüfungen bestanden" : $"ERGEBNIS: {failures} Fehler");
		return failures == 0 ? 0 : 1;
	}
}
