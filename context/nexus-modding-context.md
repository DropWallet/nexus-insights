# Nexus Mods & modding context (placeholder)

Add Confluence exports or hand-written context here so the LLM understands:

- **Vortex**: Nexus Mods' mod manager; deployment, load order, game detection.
- **Mod installation**: Manual vs Vortex; ESP/ESL; deployment steps.
- **Mod upload**: Creator workflow; mod page management; file types.
- **Mod Browsing**: Search, categories, filters, site UX.
- **Community**: Comments, forums, moderation.
- **Nexus premium**: Download speeds, value, paywall.
- **Mod collections**: Wabbajack, Nexus Collections; list-based installs.

Replace this file with real context from your Confluence docs.

**User Personas**

Beginner modder
Someone new to modding who is unfamiliar with Nexus Mods.

Motivations
Wants to experience a modded game for visual & gameplay improvements

Seeking to personalise their gaming experience

Inspired by friends or influencers who use mods

Getting into PC gaming and wants to explore the scene

Wants to engage in the community

Needs
Handholding to find quality content

Guidance on how to get started

Assuring that modding is legitimate (trust)

Pain points
Complexity of installing and getting it working

Language around collections and vortex can be confusing

The site feels overwhelming to use initially

Initially engaging with the community can be intimidating

Experienced modder
An experienced modder who has modded multiple games and has complex mod setups.

Motivations
Wants to specifically customise certain games in-depth

Wants games to look as good as their hardware will allow

Wants to explore mods recommended by the community

Enjoys tinkering with complex mod setups

Needs
Granular ways to search / explore specific mods

Detailed info around requirements / dependencies

Ways to evaluate mod quality

Ways to handle complex mod lists

Pain points
Toxic community

Flaky tooling / mod managers

Bad mod data

Poor instructions

Slow download speeds

Beginner modder
Someone new to uploading and curating content. This count be images, videos, collections and simple mods.

Motivations
Interest in earning rewards or monetising their content

Improve their skills and knowledge in game development

Wants to share something their proud of

Enjoys the creation process

Needs
Platforms to showcase their work and gain visibility

Recognition and rewards for their contributions

Opportunities for collaboration

Pain points
Generating interest in their mods

Steep learning curve

Upload process is tedious

Lack of guidance where to start

Hard to get eyes on their creations

Experienced creator
Someone who creates complex mods or tooling, understands versioning and deeper development practices.

Motivations
Wants to earn more from their creations

Possibly transition to full time game dev

Enjoys recognition and feedback from the modding community

Internet fame

Motivated by ‘giving back’ to the community

Enjoys working alongside other creators

Pushing the boundaries with tech

Needs
A large audience (which platforms have the most eyes - where is my audience?)

Ways to spot a gap in the market / competitor analysis

Easy way to manage mods

Easy way to manage feedback

Pain points
Burnout

Community drama

Lack of time

Lack of integrations

Hard to manage bug reports

Hard to manage questions for popular mods

**Re building mods**

Currently: As of the time of this writing (2025) file storage at Nexus Mods works much like any bulk file storage service, users upload a file and it is stored verbatim on our servers requests for this file are made for the full file. There are several issues with this approach that would be nice to resolve as part of Mods 2.0

 

Large Files

Large files have several technical challenges on the internet. To be reductive, the internet responds better with larger numbers of small files vs a small number of larger files. The breaking point here is roughly in the 500MB range. Larger files mean fewer caching systems will attempt to cache the files, and there’s a higher chance a TCP connection drop to cause the file download to need to be restarted. 

At one point Cloudflare (our caching layer) would refuse to cache files larger than 500MB, that limit has been raised (to ~1GB) but many other caching layers still have limits this low. 

Some of the features here could be implemented via HTTP Range requests (a special HTTP call that requests a subset of a file instead of the full file), but this doesn’t help for SOILD formats (explained below)

 

Non-uniform file formats

Currently users upload files in any number of formats: RAR, 7zip, zip, etc. And each of those formats may have several sub formats. Several of these formats (7zip and RAR) are problematic from a modding perspective since they are tied up in badly documented file formats, and proprietary implementations. It would be very helpful to be able to standardize the formats in a way that would reduce the number of formats mod managers would need to handle.

 

SOLID file formats

Most of the above archive formats are some form of SOLID, meaning that the entire file up to a given entry must be read to get access to that entry. If a 2GB archive contains two 1MB files a user needs, the user must download the entire archive to get those files. HTTP Range requests don’t help here because the file is solid, so even with a Range request the reader must read through the entire archive to get to the entries required. 

One way to improve this process would be to recompress in a non-SOILD format (like ZIP), using range requests an app could read the table of contents (at the end of the file) then use other range requests to get access to the specific part of the archive required. Alternatively we could store the files in chunks (described below). 

 

Lack of metadata on files inside archives

Currently, since files are stored in an opaque format there is no way to search for files inside uploads using any sort of criteria. Having the filename and hashes of files has several use cases; 

Discoverability for users. Some games, such as Skyrim use a specific naming scheme for items in the game. So users could search for iron_sword.nif to find any mods that may work as a replacer for Iron Swords

External tools such as LOOT refer to missing dependencies by the plugin file name. They will say: “missing dependency ralph_weaprework.esp is not in the load order” and without a way to search for that filename users have no way to know what mod that file would be a part of. Chances are the file is only ever in one mod (modders don’t tend to re-use plugin names), so just being able to search for the name would help a lot.

Some tools such as Wabbajack and NMA could perform small optimizations and provide tools based on the ability to look up a file found inside a mod based on the hash. xxHash3 is recommended here as it is extremely fast (runs at the memory interface speed), is compact (64bit), and has great collision resilience. It also happens to be what NMA uses internally. 

 

Requested Features:

 

Uncompress all uploads and store as smaller files (either combined into chunks or as single-file storage

Hash and store the filenames and hashes in a searchable format

Store the mapping of archive hashes/names to file hashes/names. (for example, upload4424.zip contains /foo/bar.dds and /bar/qux.dds)

Compress these stored parts as required, but keep file sizes small (recommended 10MB or smaller)

Provide APIs for downloading these chunks and querying for the files by name and/or hash.

 

User Benefits

 

Cloud modding - online references to files that only get downloaded and injected into your game files when you have completed your list/loadout.

Mod restore - if you break your mods you can restore them, like steam rebuilds. 

Faster downloads - Smaller downloads

Installing mods is applying the mods, no additional install process. 

For FOMODS you can download only the files you need rather than the whole FOMOD.

Search for files within mods not just mods. 

Resumable downloads - if a mod fails to download can pick up from the file level not overall mod size.

**Modding problem statements**

File Storage
What’s the problem?
As of the time of this writing (2025) file storage at Nexus Mods works much like any bulk file storage service, users upload a file and it is stored verbatim on our servers requests for this file are made for the full file. There are several issues with this approach that would be nice to resolve as part of Mods 2.0

Large Files

Large files have several technical challenges on the internet. To be reductive, the internet responds better with larger numbers of small files vs a small number of larger files. The breaking point here is roughly in the 500MB range. Larger files mean fewer caching systems will attempt to cache the files, and there’s a higher chance a TCP connection drop to cause the file download to need to be restarted. 

At one point Cloudflare (our caching layer) would refuse to cache files larger than 500MB, that limit has been raised (to ~1GB) but many other caching layers still have limits this low. 

Some of the features here could be implemented via HTTP Range requests (a special HTTP call that requests a subset of a file instead of the full file), but this doesn’t help for SOILD formats (explained below)

Non-uniform file formats

Currently users upload files in any number of formats: RAR, 7zip, zip, etc. And each of those formats may have several sub formats. Several of these formats (7zip and RAR) are problematic from a modding perspective since they are tied up in badly documented file formats, and proprietary implementations. It would be very helpful to be able to standardize the formats in a way that would reduce the number of formats mod managers would need to handle.

SOLID file formats

Most of the above archive formats are some form of SOLID, meaning that the entire file up to a given entry must be read to get access to that entry. If a 2GB archive contains two 1MB files a user needs, the user must download the entire archive to get those files. HTTP Range requests don’t help here because the file is solid, so even with a Range request the reader must read through the entire archive to get to the entries required. 

One way to improve this process would be to recompress in a non-SOILD format (like ZIP), using range requests an app could read the table of contents (at the end of the file) then use other range requests to get access to the specific part of the archive required. Alternatively we could store the files in chunks (described below). 

Lack of metadata on files inside archives

Currently, since files are stored in an opaque format there is no way to search for files inside uploads using any sort of criteria. Having the filename and hashes of files has several use cases; 

Discoverability for users. Some games, such as Skyrim use a specific naming scheme for items in the game. So users could search for iron_sword.nif to find any mods that may work as a replacer for Iron Swords

External tools such as LOOT refer to missing dependencies by the plugin file name. They will say: “missing dependency ralph_weaprework.esp is not in the load order” and without a way to search for that filename users have no way to know what mod that file would be a part of. Chances are the file is only ever in one mod (modders don’t tend to re-use plugin names), so just being able to search for the name would help a lot.

Some tools such as Wabbajack and NMA could perform small optimizations and provide tools based on the ability to look up a file found inside a mod based on the hash. xxHash3 is recommended here as it is extremely fast (runs at the memory interface speed), is compact (64bit), and has great collision resilience. It also happens to be what NMA uses internally. 

Requested Features:
Uncompress all uploads and store as smaller files (either combined into chunks or as single-file storage

Hash and store the filenames and hashes in a searchable format

Store the mapping of archive hashes/names to file hashes/names. (for example, upload4424.zip contains /foo/bar.dds and /bar/qux.dds)

Compress these stored parts as required, but keep file sizes small (recommended 10MB or smaller)

Provide APIs for downloading these chunks and querying for the files by name and/or hash.

User Benefits
Cloud modding - online references to files that only get downloaded and injected into your game files when you have completed your list/loadout.

Mod restore - if you break your mods you can restore them, like steam rebuilds. 

Faster downloads - Smaller downloads

Installing mods is applying the mods, no additional install process. 

For FOMODS you can download only the files you need rather than the whole FOMOD.

Search for files within mods not just mods.

Updating Mods
What’s the problem?
When a modder updates a mod (or list of mods, e.g. a collection), they have to download the new file(s) in their entirety. For larger files, this can be time consuming and expensive. This is largely because we are unable to compare the differences between file versions, serve the difference and then compile it correctly on the other end.

Context
We want to make it cheaper and faster to update mod. This may be an ideal opportunity to improve premium value.

Here is an example of a large mod with good versioning, where you can see current and old files: Beyond Skyrim - Bruma SE 

There are some file types that are internally compressed:

📄 BSHeartland - Textures.bsa (2.1 GB)

📄 BSHeartland.bsa (1.2 GB)

📄 BSHeartland.esm (48.3 MB)

Dependencies
What’s the problem?
When one mod depends on another, users need to be made aware and need to install the dependency in order to get their chosen mod working.

We currently store mod dependency data at a mod-level, not a file-level. This means that we do not know specifically which file is needed by the user. As a result, the user or mod manager selects the latest main file and installs that. This might not be the correct dependency, so the modder may have installed a file which does nothing or in some cases makes things worse.

Some mods also have dependencies on the FOMOD configuration of other mods.

Context
Here is an example of a mod that requires SKSE, but where that is only stated in the description and is not stored in any way that a mod manager can meaningfully understand: RaceMenu 

The Skyrim Script Extender (SKSE64), Version 2.0.7 (or newer matching the RaceMenu version) is REQUIRED to run RaceMenu SE.

Patches
What’s the problem?
Patches are a common type of mod that “fix” the compatibility between two mods. We do not currently have any way of marking a patch as a compatibility fix between two mods.

Context
The only way to find out what mods this patch hub covers is reading the description: kryptopyr's Patch Hub

Compatibility
What’s the problem?
We do not store or return any sort of mod compatibility data.

Mod authors need to detail this in one of the free form fields on a mod page. Modders need to dig into and read this, if it is even provided.

Inexperienced modders have no idea what will work or won’t work together.

Context
Mods that change the same files will often not work together, but we don’t surface that information on the site. Understanding why mods aren’t compatible requires some technical comprehension.

File Versioning
What’s the problem?
Users want to know when an update is available for the mods they are using, but mod managers don’t have a reliable method for determining whether a mod has updated files.

Context
Nexus Mods does not enforce any sort of semantic versioning on mod files, so mod authors use whatever versioning logic they prefer. Unfortunately, this doesn’t make it possible to programmatically determine file versions.

We also have a fairly open mod file system which adds to the complexity:

Main Files

Optional Files

Miscellaneous Files

Deleted Files

Old Files

Here is a great example of a mod that does what it wants, but is impossible to understand: A Quality World Map 

Cross-game Mods
What’s the problem?
Currently mods only support a one-to-one relationship with games. The result is that mod authors who publish mods that work with multiple games upload them multiple times.

Modders also end up downloading, installing and seeking support for the same mod from different places.

Context
Fluffy Mod Manager has been uploaded seven times to the site:

Resident Evil 4

Resident Evil Village

Street Fighter 6

Dragon’s Dogma 2

Modding Tools

Uncharted: Legacy of Thieves Edition

The Last of Us Part 1

Mod Organizer 2 has been uploaded to Skyrim Special Edition, so even though it supports other games it can’t be found when searching whilst scoped to a supported game:

Fallout New Vegas

Fallout 4

Fallout 3

Oblivion

Morrowind

Game DLC
What’s the problem?
Users can download and install mods that won’t work for them, because they don’t own the DLC content that the mod changes.

Context
Some mods depend on a DLC being installed on the user’s system in order to work, often because they change or manipulate files specific to that DLC. Here is an example:

Fallout 4 - Harpoon Audio Overhaul Mod: Harpoon - Audio Overhaul Mod - Far Harbour

Mod Authors are not able to set DLC as a requirement, so we do not store that data or pass it on to mod managers.

Game Versions
What’s the problem?
Users can download and install mods that won’t work with the version of the game they have installed.

Context
Mods are often incompatible with some game versions, due to features not being introduced until later game builds. This is a common problem in Stardew Valley or early access titles.

Faster Paths 

Mod Authors are not able to set game versions on mods, so we do not store that data or pass it on to mod managers.

Uploading Mods
What’s the problem?
There are quite a few problems with mod uploads currently:

As a Mod Author, I want to upload and update mods from a third-party, so that I do not need to use the Nexus Mods UI

Lots of authors user other platforms or tools to host their mods and either don't use Nexus or upload after using their primary platform. For example, many projects will be maintained on GitHub. Authors are then required to visit Nexus Mods in order to push those uploads or updates. We'd like to make life easier for these creators, so they're spending less time uploading or updating and more time creating.

Here's a non-exhaustive list of the kind of places authors use:

GitHub

Curseforge

Thunderstore

Mod io

Gamebanana

ModDB

There's a similar problem statement that's related to this, where the "third-party" is more clearly defined as "creator tools". We have good relationships with some tool makers and there is scope for working with these authors to add some sort of upload/update integration to their software. For example, CreationKit for Skyrim.

As a Mod Author, I want to upload RAR files to Nexus Mods, so that I can share my creations

Right now we don't often accept RAR files during the file upload process. These fail silently and the author has to email support or ask a moderator on Discord for help. Ideally users should be able to upload commonly used compressed file formats, or at the very least we should improve communication.

As a Mod Author, I want to upload my mods quickly and easily, so that I can spend less time uploading and more time creating

The mod upload form is long, old and difficult to use. No doubt there are plenty of UX and Design improvements that would make it drastically easier and quicker to upload/update mods.

In addition to this, we also have mod authors who want to upload multiple mods over various time periods and we don't currently offer any tooling to help them do this. For example, if you always configure your mod permissions in a specific way then you need to do this every single time.

As a Modder, I want the files I download from Nexus Mods to be safe, so that I am not exposed to viruses

This is a no-brainer and shouldn't need too much explanation. We must not host or serve malicious files to users. The Community team have plenty of examples where we are failing on this.

As a Mod Author, when there are problems with my file upload I would like be kept informed, so that I can take appropriate action

Currently the file upload process is not verbose and error prone. If something goes wrong, we don't communicate it whatsoever. Authors have to email support or ask a moderator on Discord for help.

As Nexus Mods, I want to let Mod Authors know about Donation Points when they upload, so that they do not miss out on rewards

We don't do a great job of shouting about rewards during the upload process and lots of authors may be missing out.

As a Mod Author, I want Nexus to stop mangling filenames on upload, so that modding some games is possible

We mangle filenames on upload, this specifically causes issues with modding games like Farming Simulator.

Context
Whether or not we can tackle mod upload problems before we take on the other statements in this document isn’t clear.