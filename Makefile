# Makefile
#
# @category    Web Application
# @author      Nicola Asuni <info@tecnick.com>
# @copyright   2013-2019 Nicola Asuni - Tecnick.com LTD
# @license     MIT (see LICENSE)
# @link        https://github.com/tecnickcom/web-cctray
#
# This file is part of web-cctray software.
# ----------------------------------------------------------------------------------------------------------------------

# List special make targets that are not associated with files
.PHONY: help all deps clean build install uninstall rpm deb bz2 bintray

# Project owner
OWNER=tecnickcom

# Project vendor
VENDOR=${OWNER}

# Project name
PROJECT=web-cctray

# Project version
VERSION=$(shell cat VERSION)

# Project release number (packaging build number)
RELEASE=$(shell cat RELEASE)

# Name of RPM or DEB package
PKGNAME=${OWNER}-${PROJECT}

# Web root path
WEBROOT=usr/share

# Default installation path for code
WEBPATH=${WEBROOT}/${PROJECT}

# Path for configuration files
CONFIGPATH=${WEBPATH}/config/

# Default installation path for documentation
DOCPATH=usr/share/doc/$(PKGNAME)/

# Installation path for the code
PATHINSTWEB=$(DESTDIR)/$(WEBPATH)

# Installation path for the configuration files
PATHINSTCFG=$(DESTDIR)/$(CONFIGPATH)

# Installation path for documentation
PATHINSTDOC=$(DESTDIR)/$(DOCPATH)

# Current directory
CURRENTDIR=$(shell pwd)

# RPM Packaging path (where RPMs will be stored)
PATHRPMPKG=$(CURRENTDIR)/target/RPM

# DEB Packaging path (where DEBs will be stored)
PATHDEBPKG=$(CURRENTDIR)/target/DEB

# BZ2 Packaging path (where BZ2s will be stored)
PATHBZ2PKG=$(CURRENTDIR)/target/BZ2

# --- MAKE TARGETS ---

# Display general help about this command
help:
	@echo ""
	@echo "Welcome to ${PROJECT} make."
	@echo "The following commands are available:"
	@echo ""
	@echo "    make deps        : Download dependencies"
	@echo "    make build       : Build the project in target"
	@echo "    make clean       : Delete the target directory"
	@echo ""
	@echo "    make install     : Install this library"
	@echo "    make uninstall   : Remove all installed files"
	@echo ""
	@echo "    make rpm         : Build an RPM package"
	@echo "    make deb         : Build a DEB package"
	@echo "    make bz2         : Build a tar bz2 (tbz2) compressed archive"
	@echo ""

# alias for help target
all: help

# Install dependencies (assume Ubuntu/Debian OS)
deps:
	rm -rf ./vendor
	mkdir -p ./vendor
	wget --directory-prefix=./vendor/ https://github.com/htacg/tidy-html5/releases/download/5.4.0/tidy-5.4.0-64bit.deb
	dpkg-deb -x ./vendor/tidy-5.4.0-64bit.deb ./vendor/
	npm install --prefix ./vendor/ uglify-js
	npm install --prefix ./vendor/ csso-cli

# Clean the target directory
clean:
	rm -rf ./target
	rm -rf ./vendor

# Build the project
build:
	rm -rf ./target/${WEBPATH}
	mkdir -p ./target/${WEBPATH}
	cp -rf ./src/* ./target/${WEBPATH}
	for i in `find ./target/${WEBPATH} | grep -E "\.js$$"`; do ./vendor/node_modules/.bin/uglifyjs $$i --compress --mangle --output $$i; done
	for i in `find ./target/${WEBPATH} | grep -E "\.css$$"`; do ./vendor/node_modules/.bin/csso --input $$i --output $$i; done
	for i in `find ./target/${WEBPATH} | grep -E "\.html$$"`; do ./vendor/usr/bin/tidy -modify $$i; done

# Install this application
install: uninstall
	mkdir -p $(PATHINSTWEB)
	cp -f ./target/${WEBPATH}/index.html $(PATHINSTWEB)
	cp -f ./target/${WEBPATH}/favicon.ico $(PATHINSTWEB)
	cp -rf ./target/${WEBPATH}/static $(PATHINSTWEB)
	find $(PATHINSTWEB) -type d -exec chmod 755 {} \;
	find $(PATHINSTWEB) -type f -exec chmod 644 {} \;
	mkdir -p $(PATHINSTDOC)
	cp -f ./LICENSE $(PATHINSTDOC)
	cp -f ./README.md $(PATHINSTDOC)
	cp -f ./VERSION $(PATHINSTDOC)
	cp -f ./RELEASE $(PATHINSTDOC)
	chmod -R 644 $(PATHINSTDOC)*
ifneq ($(strip $(CONFIGPATH)),)
	mkdir -p $(PATHINSTCFG)
	touch -c $(PATHINSTCFG)*
	cp -ru ./target/${CONFIGPATH}* $(PATHINSTCFG)
	find $(PATHINSTCFG) -type d -exec chmod 755 {} \;
	find $(PATHINSTCFG) -type f -exec chmod 644 {} \;
endif

# Remove all installed files (excluding the config dir)
uninstall:
	rm -f $(PATHINSTWEB)/index.html
	rm -f $(PATHINSTWEB)/favicon.ico
	rm -rf $(PATHINSTWEB)/static
	rm -rf $(PATHINSTDOC)

# --- PACKAGING ---

# Build the RPM package for RedHat-like Linux distributions
rpm:
	rm -rf $(PATHRPMPKG)
	rpmbuild \
	--define "_topdir $(PATHRPMPKG)" \
	--define "_vendor $(VENDOR)" \
	--define "_owner $(OWNER)" \
	--define "_project $(PROJECT)" \
	--define "_package $(PKGNAME)" \
	--define "_version $(VERSION)" \
	--define "_release $(RELEASE)" \
	--define "_current_directory $(CURRENTDIR)" \
	--define "_webpath /$(WEBPATH)" \
	--define "_docpath /$(DOCPATH)" \
	--define "_configpath /$(CONFIGPATH)" \
	-bb resources/rpm/rpm.spec

# Build the DEB package for Debian-like Linux distributions
deb:
	rm -rf $(PATHDEBPKG)
	make install DESTDIR=$(PATHDEBPKG)/$(PKGNAME)-$(VERSION)
	rm -f $(PATHDEBPKG)/$(PKGNAME)-$(VERSION)/$(DOCPATH)LICENSE
	tar -zcvf $(PATHDEBPKG)/$(PKGNAME)_$(VERSION).orig.tar.gz -C $(PATHDEBPKG)/ $(PKGNAME)-$(VERSION)
	cp -rf ./resources/debian $(PATHDEBPKG)/$(PKGNAME)-$(VERSION)/debian
	mkdir -p $(PATHDEBPKG)/$(PKGNAME)-$(VERSION)/debian/missing-sources
	cp ./src/static/js/* $(PATHDEBPKG)/$(PKGNAME)-$(VERSION)/debian/missing-sources/
	find $(PATHDEBPKG)/$(PKGNAME)-$(VERSION)/debian/ -type f -exec sed -i "s/~#DATE#~/`date -R`/" {} \;
	find $(PATHDEBPKG)/$(PKGNAME)-$(VERSION)/debian/ -type f -exec sed -i "s/~#VENDOR#~/$(VENDOR)/" {} \;
	find $(PATHDEBPKG)/$(PKGNAME)-$(VERSION)/debian/ -type f -exec sed -i "s/~#PROJECT#~/$(PROJECT)/" {} \;
	find $(PATHDEBPKG)/$(PKGNAME)-$(VERSION)/debian/ -type f -exec sed -i "s/~#PKGNAME#~/$(PKGNAME)/" {} \;
	find $(PATHDEBPKG)/$(PKGNAME)-$(VERSION)/debian/ -type f -exec sed -i "s/~#VERSION#~/$(VERSION)/" {} \;
	find $(PATHDEBPKG)/$(PKGNAME)-$(VERSION)/debian/ -type f -exec sed -i "s/~#RELEASE#~/$(RELEASE)/" {} \;
	echo $(WEBPATH)/ > $(PATHDEBPKG)/$(PKGNAME)-$(VERSION)/debian/$(PKGNAME).dirs
	echo "$(WEBPATH)/* $(WEBPATH)" > $(PATHDEBPKG)/$(PKGNAME)-$(VERSION)/debian/install
	echo $(DOCPATH) >> $(PATHDEBPKG)/$(PKGNAME)-$(VERSION)/debian/$(PKGNAME).dirs
	echo "$(DOCPATH)* $(DOCPATH)" >> $(PATHDEBPKG)/$(PKGNAME)-$(VERSION)/debian/install
	echo "new-package-should-close-itp-bug" > $(PATHDEBPKG)/$(PKGNAME)-$(VERSION)/debian/$(PKGNAME).lintian-overrides
	cd $(PATHDEBPKG)/$(PKGNAME)-$(VERSION) && debuild -us -uc

# build a compressed bz2 archive
bz2:
	rm -rf $(PATHBZ2PKG)
	make install DESTDIR=$(PATHBZ2PKG)
	tar -jcvf $(PATHBZ2PKG)/$(PKGNAME)-$(VERSION)-$(RELEASE).tbz2 -C $(PATHBZ2PKG) $(WEBROOT)

# upload linux packages to bintray
bintray: rpm deb
	@curl -T target/RPM/RPMS/noarch/tecnickcom-${PROJECT}-${VERSION}-${RELEASE}.noarch.rpm -u${APIUSER}:${APIKEY} -H "X-Bintray-Package:${PROJECT}" -H "X-Bintray-Version:${VERSION}" -H "X-Bintray-Publish:1" -H "X-Bintray-Override:1" https://api.bintray.com/content/tecnickcom/rpm/tecnickcom-${PROJECT}-${VERSION}-${RELEASE}.noarch.rpm
	@curl -T target/DEB/tecnickcom-${PROJECT}_${VERSION}-${RELEASE}_all.deb -u${APIUSER}:${APIKEY} -H "X-Bintray-Package:${PROJECT}" -H "X-Bintray-Version:${VERSION}" -H "X-Bintray-Debian-Distribution:all" -H "X-Bintray-Debian-Component:main" -H "X-Bintray-Debian-Architecture:all" -H "X-Bintray-Publish:1" -H "X-Bintray-Override:1" https://api.bintray.com/content/tecnickcom/deb/tecnickcom-${PROJECT}_${VERSION}-${RELEASE}_all.deb
