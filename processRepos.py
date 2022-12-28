import urllib.request
import json
import yaml

languageContents = urllib.request.urlopen("https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml").read()
languages = yaml.safe_load(languageContents)

repoContents = urllib.request.urlopen("https://api.github.com/users/scgrn/repos").read()
inputRepos = json.loads(repoContents)

outputRepos = [];

for i in inputRepos:
    color = "#555555"
    if (i["language"] != None):
        color = languages[i["language"]].get('color')
    else:
        i["language"] = "Unknown"

    outputRepos.append({
        "name": i["name"],
        "description": i["description"],
        "url": i["html_url"],
        "language": i["language"],
        "color": color,
        "forks": i["forks_count"],
        "stars": i["stargazers_count"]
    })

with open('repos.json', 'w') as json_file:
    json.dump(outputRepos, json_file, indent = 2)
