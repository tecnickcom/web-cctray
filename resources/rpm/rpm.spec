# SPEC file

%global c_vendor    %{_vendor}
%global gh_owner    %{_owner}
%global gh_project  %{_project}

Name:      %{_package}
Version:   %{_version}
Release:   %{_release}%{?dist}
Summary:   Web-based dashboard for cctray.xml files

Group:     Applications/Services
License:   %{_docpath}/LICENSE
URL:       https://github.com/%{gh_owner}/%{gh_project}

BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}-%(%{__id_u} -n)
BuildArch: noarch

Provides:  %{gh_project} = %{version}

%description
This web application displays the build status of projects on a continuous integration server by parsing the cctray.xml file.

%build
#(cd %{_current_directory} && make build)

%install
rm -rf $RPM_BUILD_ROOT
(cd %{_current_directory} && make install DESTDIR=$RPM_BUILD_ROOT)

%clean
rm -rf $RPM_BUILD_ROOT
#(cd %{_current_directory} && make clean)

%files
%attr(-,root,root) %{_webpath}
%attr(-,root,root) %{_docpath}
%docdir %{_docpath}
%config(noreplace) %{_configpath}*

%changelog
* Sat Jun 15 2013 Nicola Asuni <info@tecnick.com> 1.0.0-1
- Initial Commit
