# web-cctray

*Web-based dashboard for cctray.xml files*

[![Master Build Status](https://secure.travis-ci.org/tecnickcom/web-cctray.png?branch=master)](https://travis-ci.org/tecnickcom/web-cctray?branch=master)

[![Donate via PayPal](https://img.shields.io/badge/donate-paypal-87ceeb.svg)](https://www.paypal.com/donate/?hosted_button_id=NZUEC5XS8MFBJ)
*Please consider supporting this project by making a donation via [PayPal](https://www.paypal.com/donate/?hosted_button_id=NZUEC5XS8MFBJ)*

* **category**    Web Application
* **author**      Nicola Asuni <info@tecnick.com>
* **copyright**   2013-2020 Nicola Asuni - Tecnick.com LTD
* **license**     MIT (see LICENSE)
* **link**        https://github.com/tecnickcom/web-cctray

## Description

This web application displays the build status of projects on a continuous integration server by parsing the `cctray.xml` file.

This project can be used directly by opening the `index.html` file in the *src* directory, or it can be packaged and minimized using the tools described below.

![web-cctray screenshot](resources/screenshot.png "web-cctray screenshot")


### Otional query parameters:

* **c** : can be used to specify an alternative configuration file name, excluding the ".json" extension.
* **d** : can be used to specify the configured dashboard to display, otherwise all the dashboards will be displayed in turn.
* **a** : comma-separated list of activities to filter. Valid values are: Sleeping, Building, CheckingModifications, Pending.
* **s** : comma-separated list of statuses to filter. Valid values are: Success, Failure, Exception, Unknown.
* **x** : comma-separated list of substrings to remove from the the pipeline name.
* **l** : flag to enable lexicographical order.

#### Examples:

* `http://example.com/web-cctray/index.html?c=alternative_config&d=DashboardName&t=1&l=1`
* `http://example.com/web-cctray/index.html?c=config-all&s=Failure`
* `http://example.com/web-cctray/index.html?c=config-all&a=Building&s=Failure&x=%20::%20Default`


## Configuration

Copy, rename and edit the `src/config/config.example.json` to `src/config/config.json` file.

### Configuration fields:

* **refresh**   : Number of seconds to wait before refreshing the page.
* **blank**     : URL of the resource to display in case of blank dashboard (no pipelines to display)
* **dashboard** : Array of dashboards. It is possible to define multiple dashboards.
    * **name**      : Generic name.
    * **url**       : URL of the cctray.xml file, for example: http://username:password@example.com/cctray.xml
    * **access**    : String containing "user:password" for Basic HTTP Authentication.
    * **boxration** : Default width/height ratio for a pipeline box.
    * **pipeline**  : List of the CI/CD pipeline names as reported by cctray.xml, or the word "all" to import all pipelines specified in cctray.xml.
    * **exclude**   : List of the CI/CD pipeline names to exclude.
    * **activity**  : List of activities to filter. Valid values are: Sleeping, Building, CheckingModifications, Pending.
    * **status**    : List of statuses to filter. Valid values are: Success, Failure, Exception, Unknown.
    * **stripname** : List of substrings to remove from the the pipeline name.
    * **sort**      : Sort the pipelines in lexicographical order when set to true.
    

### Configuration example

```
{
  "refresh": 5,
  "blank": "https://www.example.com/page_to_display_in_case_of_blank_dashboard.html",
  "dashboard": [
    {
      "name": "demo1",
      "url": "http://localhost/cctray.example.xml",
      "access": "user:password",
      "boxratio": 2,
      "pipeline": [
        "build-linux :: build-non-server",
        "build-linux :: build-non-server :: agent",
        "build-linux :: build-non-server :: agent-bootstrapper"
      ]
    },
    {
      "name": "demo2",
      "url": "http://localhost/cctray.example.xml",
      "access": "",
      "boxratio": 2,
      "pipeline": [
        "build-linux :: build-non-server :: util",
        "plugins :: build",
        "gocd-docs.go.cd-release-16.6.0 :: Build :: build_job",
        "UploadInstallers :: UploadInstallers",
        "github-oauth-authorization-plugin-PR :: build",
        "gocd-docs.go.cd-release-16.9.0 :: PushToGHPages :: pushtoghpages_job",
        "gocd-docs.go.cd-release-16.5.0 :: PushToGHPages",
        "docs.go.cd-release-17.7.0 :: PushToGHPages"
      ]
    },
    {
      "name": "demo3",
      "url": "http://localhost/cctray.example.xml",
      "access": "",
      "boxratio": 2,
      "activity": ["Sleeping", "Building", "CheckingModifications", "Pending"],
      "status": ["Success", "Failure", "Exception", "Unknown"],
      "stripname": [" :: ", "build"],
      "sort": true,
      "separator": " :: ",
      "level": 3,
      "pipeline": [
        "all"
      ],
      "exclude": [
        "gocd-docs.go.cd-release-16.5.0 :: PushToGHPages",
        "docs.go.cd-release-17.7.0 :: PushToGHPages"
      ]
    },
    {
      "name": "demo4",
      "url": "http://localhost/cctray.example.xml",
      "access": "",
      "boxratio": 2,
      "pipeline": [
        "*http://www.example.com/external_page.html"
      ]
    }
  ]
}
```

## Supported CI/CD systems

The following is a list of CI/CD systems that provides a cctray.xml file:

* [Buddybuild](https://www.buddybuild.com)
* [CircleCI](https://circleci.com)
* [CruiseControl](http://cruisecontrol.sourceforge.net)
* [CruiseControl.NET](http://www.cruisecontrolnet.org)
* [CruiseControl.rb](http://cruisecontrolrb.thoughtworks.com)
* [GoCD](http://www.go.cd)
* [GreenhouseCI](http://greenhouseci.com)
* [Hudson](http://hudson-ci.org)
* [Jenkins](http://jenkins-ci.org)
* [Semaphore](https://semaphoreapp.com)
* [Snap CI](https://snap-ci.com)
* [TeamCity](https://www.jetbrains.com/teamcity)
* [Travis](https://travis-ci.org)


## Packages

Pre-built packages are available at:

* DEB : https://bintray.com/tecnickcom/deb/web-cctray
* RPM : https://bintray.com/tecnickcom/rpm/web-cctray

The application is installed by default in /usr/share/web-cctray


## Getting started (for developers)

This project include a Makefile that allows you to automate common operations in a Debian/Ubuntu enviromnent.

To see all available options:
```
make help
```
To build the project (requires node):
```
make deps build
```

## Notes

### Example of nginx configuration as TLS termination proxy for the CI/CD system.

In this example *web-cctray* and CI/CD system (GoCD) are installed in the same server.
The CORS (*cross-origin resource sharing*) settings are there in case you want install *web-cctray* in a diffrent server.
You should replace ```<YOUR_SERVER_NAME>``` with your own server name (e.g. "example.com"), set the correct URL to the CI/CD system
(in this example: ```http://localhost:8153/```) and the *cctray.xml* full URL (in this example: ```http://localhost:8153/go/cctray.xml```).

```
server {
	listen 443;
	ssl on;
	ssl_certificate /etc/letsencrypt/live/<YOUR_SERVER_NAME>/cert.pem;
	ssl_certificate_key /etc/letsencrypt/live/<YOUR_SERVER_NAME>/privkey.pem;
	server_name <YOUR_SERVER_NAME>;
	server_tokens off;
	location /web-cctray {
		root /usr/share;
		index index.html;
		access_log off;
		expires 0;
		add_header Cache-Control private;
		sendfile  off;
		try_files $uri $uri/ =404;
	}
	location / {
		proxy_pass http://localhost:8153/;
	}
	location = /go/cctray.xml {
		# CORS settings
		more_set_headers 'Access-Control-Allow-Origin: $http_origin';
		more_set_headers 'Access-Control-Allow-Methods: GET, OPTIONS';
		more_set_headers 'Access-Control-Allow-Credentials: true';
		more_set_headers 'Access-Control-Allow-Headers: Origin,Authorization,Cache-Control,X-Requested-With,Content-Type,Accept,Credentials';
		if ($request_method = OPTIONS) {
			return 200;
		}
		proxy_pass http://localhost:8153/go/cctray.xml;
	}
}
```
