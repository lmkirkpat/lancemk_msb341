-- Knack's installer applet (specs/006-installer T014, plan D3, contracts/install-layout.md).
-- Compiled by installer/build.mjs with osacompile; the payload sits in Contents/Resources/payload.
-- The dialogs live here; the work is done by setup/install.mjs on the private Node, which a
-- one-line /bin/bash step unpacks with ditto. Programs run through NSTask with a fixed PATH, so the
-- access key goes to them over stdin only: it's never in a command line (do shell script would put
-- it in one), a file or a log. No Terminal, no admin password, and After Effects is never quit for
-- the person.

use AppleScript version "2.4"
use framework "Foundation"
use scripting additions

property appTitle : "Knack"
property systemPath : "/usr/bin:/bin:/usr/sbin:/sbin"

on run
	set payloadDir to (POSIX path of (path to me)) & "Contents/Resources/payload"
	set nodeDir to ""
	set accessKey to ""
	try
		-- 1. What it adds, and what leaves the Mac (FR-007). Nothing happens before Agree.
		display dialog "Knack will add to your Mac:" & return & ¬
			"• the Knack panel for After Effects, and its connection to After Effects" & return & ¬
			"• the mentor that runs your lessons" & return & ¬
			"• a folder for your lesson history" & return & return & ¬
			"During lessons, the lesson text and frames from your comp are sent to Anthropic, the model provider." & return & return & ¬
			"Nothing is installed until you agree." buttons {"Cancel", "Agree and Install"} default button 2 cancel button 1 with title appTitle

		-- 2. Unpack the private Node and check this Mac. Reads only.
		set progress description to "Checking this Mac…"
		set prepScript to "set -e; a=x64; [ \"$(/usr/sbin/sysctl -n hw.optional.arm64 2>/dev/null)\" = 1 ] && a=arm64; d=$(/usr/bin/mktemp -d \"${TMPDIR:-/tmp}/knack-node.XXXXXX\"); /usr/bin/ditto -x -k \"$1/node/node-$a.zip\" \"$d\"; echo \"$d\"; exec \"$d/bin/node\" \"$1/version/setup/install.mjs\" preflight --payload \"$1\""
		set prep to my runTask("/bin/bash", {"-c", prepScript, "knack", payloadDir}, missing value)
		if (count of paragraphs of prep) < 2 then
			my stopWith("This copy of the installer is incomplete. Download it again.", "")
			return
		end if
		set nodeDir to paragraph 1 of prep
		if paragraph 2 of prep is not "ok" then
			my stopWith(my restOf(prep, 3), nodeDir)
			return
		end if

		-- 3. The access key: checked before anything is installed, held only in memory.
		set keyStatus to ""
		repeat
			set reply to display dialog "Paste the access key you were given." default answer "" with hidden answer buttons {"Cancel", "Continue"} default button 2 cancel button 1 with title appTitle
			set accessKey to text returned of reply
			set progress description to "Checking your key…"
			set keyStatus to my firstLine(my runNode(nodeDir, {payloadDir & "/version/setup/install.mjs", "key-check", "--payload", payloadDir, "--node-dir", nodeDir}, accessKey))
			if keyStatus is "works" then exit repeat
			if keyStatus is "rejected" then
				display dialog "That key didn't work. Check it and paste it again." buttons {"Cancel", "Try Again"} default button 2 cancel button 1 with title appTitle
			else if keyStatus is "bad_format" or keyStatus is "no_key" then
				display dialog "That doesn't look like an access key. Paste it again." buttons {"Cancel", "Try Again"} default button 2 cancel button 1 with title appTitle
			else if keyStatus is "out_of_credit" then
				set choice to button returned of (display dialog "That key works, but its account needs credit before lessons can start. You can add credit later." buttons {"Cancel", "Use Another Key", "Continue"} default button 3 cancel button 1 with title appTitle)
				if choice is "Continue" then exit repeat
			else
				set choice to button returned of (display dialog "Knack couldn't reach the service to check your key, so the key won't be saved yet. You can install now and add the key later by opening the installer again." buttons {"Cancel", "Try Again", "Install Without Key"} default button 2 cancel button 1 with title appTitle)
				if choice is "Install Without Key" then exit repeat
			end if
		end repeat

		-- 4. After Effects must be closed. Ask and wait; never quit it (FR-010).
		repeat
			if my firstLine(my runNode(nodeDir, {payloadDir & "/version/setup/install.mjs", "ae-open"}, missing value)) is "closed" then exit repeat
			display dialog "After Effects is open. Save your work, quit After Effects, then click Continue." buttons {"Cancel", "Continue"} default button 2 cancel button 1 with title appTitle
		end repeat

		-- 5. Install.
		set progress description to "Installing Knack…"
		set installOut to my runNode(nodeDir, {payloadDir & "/version/setup/install.mjs", "install", "--payload", payloadDir, "--node-dir", nodeDir, "--key-status", keyStatus}, accessKey)
		set accessKey to ""
		my removeNode(nodeDir)
		set nodeDir to ""
		if my firstLine(installOut) is not "ok" then
			my stopWith(my restOf(installOut, 2), "")
			return
		end if
		set keyNote to my restOf(installOut, 2)

		-- 6. What to do next, then Check Setup as often as needed.
		set nextSteps to "Knack is installed." & return & return & ¬
			"1. Open After Effects. If it's open, quit it and open it again." & return & ¬
			"2. Choose After Effects > Settings > Scripting & Expressions, and tick “Allow Scripts to Write Files and Access Network”." & return & ¬
			"3. Choose Window > Extensions > Knack." & return & ¬
			"4. Then click Check Setup here."
		if keyNote is not "" then set nextSteps to nextSteps & return & return & keyNote
		set choice to button returned of (display dialog nextSteps buttons {"Done", "Check Setup"} default button 2 with title appTitle)
		repeat while choice is "Check Setup"
			set progress description to "Checking setup…"
			set checkOut to my runSetupCheck()
			set choice to button returned of (display dialog checkOut buttons {"Done", "Check Again"} default button 2 with title appTitle)
			if choice is "Check Again" then set choice to "Check Setup"
		end repeat
	on error errText number errNum
		set accessKey to ""
		if nodeDir is not "" then my removeNode(nodeDir)
		if errNum is not -128 then display dialog "Knack couldn't finish installing. Open the installer again to finish; your lesson history is safe." buttons {"OK"} default button 1 with title appTitle
	end try
end run

-- The installed setup check on the installed private Node.
on runSetupCheck()
	set homeDir to my homePath()
	set currentDir to homeDir & "/Library/Application Support/Knack/current"
	set out to my runTask(currentDir & "/runtime/node/bin/node", {currentDir & "/setup/setup-check.mjs"}, missing value)
	if out is "" then return "Knack couldn't run its setup check. Open the installer again."
	return out
end runSetupCheck

on runNode(nodeDir, argList, inputText)
	return my runTask(nodeDir & "/bin/node", argList, inputText)
end runNode

-- Runs a program with no shell. inputText (or missing value) goes to its stdin. → its stdout.
on runTask(exePath, argList, inputText)
	set ca to current application
	set task to ca's NSTask's alloc()'s init()
	task's setExecutableURL:(ca's NSURL's fileURLWithPath:exePath)
	task's setArguments:argList
	set tmp to system attribute "TMPDIR"
	task's setEnvironment:(ca's NSDictionary's dictionaryWithObjects:{systemPath, my homePath(), tmp} forKeys:{"PATH", "HOME", "TMPDIR"})
	set inPipe to ca's NSPipe's pipe()
	set outPipe to ca's NSPipe's pipe()
	task's setStandardInput:inPipe
	task's setStandardOutput:outPipe
	task's setStandardError:(ca's NSFileHandle's fileHandleWithNullDevice())
	set {started, launchError} to task's launchAndReturnError:(reference)
	if started as boolean is false then return ""
	set writer to inPipe's fileHandleForWriting()
	if inputText is not missing value then
		writer's writeData:((ca's NSString's stringWithString:inputText)'s dataUsingEncoding:(ca's NSUTF8StringEncoding))
	end if
	writer's closeFile()
	set outData to (outPipe's fileHandleForReading())'s readDataToEndOfFile()
	task's waitUntilExit()
	set outText to (ca's NSString's alloc()'s initWithData:outData encoding:(ca's NSUTF8StringEncoding)) as text
	if outText ends with linefeed then set outText to text 1 thru -2 of outText
	return outText
end runTask

on homePath()
	set h to POSIX path of (path to home folder)
	if h ends with "/" then set h to text 1 thru -2 of h
	return h
end homePath

on firstLine(t)
	if t is "" then return ""
	return paragraph 1 of t
end firstLine

-- Paragraphs n to the end, joined with returns; "" when there are none.
on restOf(t, n)
	set ps to paragraphs of t
	if (count of ps) < n then return ""
	set out to ""
	repeat with i from n to count of ps
		if out is not "" then set out to out & return
		set out to out & item i of ps
	end repeat
	return out
end restOf

on stopWith(message, nodeDir)
	if nodeDir is not "" then my removeNode(nodeDir)
	if message is "" then set message to "Knack couldn't finish installing. Open the installer again to finish; your lesson history is safe."
	display dialog message buttons {"OK"} default button 1 with title appTitle
end stopWith

-- Removes the unpacked Node, only if it's the folder this applet made.
on removeNode(nodeDir)
	if nodeDir contains "/knack-node." then my runTask("/bin/rm", {"-rf", nodeDir}, missing value)
end removeNode
