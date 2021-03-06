// in this file, code written in: node.js, mocha.js, chai.js, ECMAScript 6, co.js

// these are real tests I wrote as part of building out a REST API

// NOTE: co-wrap here is necessary for ES6 mocha.js generator functions to work.

'use strict';

var co = require('co'),
    chai = require('chai'),
    should = chai.should(),
    query = require('../../../src/database/postgreSQL/query-options'),
    inMemoryGateway = require('../../../test/test-doubles/gateways/inMemory-personGateway'),
    personGetUseCase = require('../../../src/usecases/personGet'),
    testUtil = require('../../../test/testUtilities');


describe('Person Use Case - Get Person by Location', () =>  {

    var people;
    var requestModel;

    var queryOptions;
    var limit = 18;

    beforeEach(function() {
        people = [];
        requestModel = testUtil.createPersonRequestModel();
        setGateway(people);
        setQueryOptions()
    });

    it('should return no people when no people exist', co.wrap(function* () {
        inMemoryGateway.data(people);
        personGetUseCase.gateway(inMemoryGateway);

        var responseModel = yield personGetUseCase.find(requestModel);

        should.not.exist(responseModel.people);
    }));

    it('should return all people when data exists', co.wrap(function*(){

        var person1 = testUtil.createPersonEntity(4);
        var person2 = testUtil.createPersonEntity(6);
        testUtil.addPerson(person1, people);
        testUtil.addPerson(person2, people);

        var responseModel = yield personGetUseCase.find(requestModel, queryOptions);

        should.exist(responseModel.people);
        responseModel.people.should.have.length(2);
        responseModel.people[0].id.should.equal(4);
        responseModel.people[1].id.should.equal(6);
    }));

    it('should return people filtered by locationId for city', co.wrap(function *(){

        var cityId = 222;
        var locations = [];

        locations.push(createLocation());
        locations.push(createLocation(cityId, null, null, null, null, null,
                                      null, null, null, null, null, null, null));

        var person1 = testUtil.createPersonEntity(4, null, null);
        var person2 = testUtil.createPersonEntity(6, null, locations);
        testUtil.addPerson(person1, people);
        testUtil.addPerson(person2, people);

        requestModel.params.locationId = locationId;

        var responseModel = yield personGetUseCase.find(requestModel, queryOptions);

        should.exist(responseModel.people);
        responseModel.people.should.have.length(1);
        responseModel.people[0].id.should.equal(6);
    }));

    it('should return people filtered by locationId for state', co.wrap(function *(){

        var stateId = 222;
        var locations = [];

        locations.push(createLocation());
        locations.push(createLocation(null, null, null, null, stateId, null,
                                      null, null, null, null, null, null, null));

        var person1 = testUtil.createPersonEntity(4, null, null);
        var person2 = testUtil.createPersonEntity(6, null ,locations);
        testUtil.addPerson(person1, people);
        testUtil.addPerson(person2, people);

        requestModel.params.locationId = locationId;

        var responseModel = yield personGetUseCase.find(requestModel, queryOptions);

        should.exist(responseModel.people);
        responseModel.people.should.have.length(1);
        responseModel.people[0].id.should.equal(6);
    }));

    it('should return people filtered by locationId for country', co.wrap(function *(){

        var countryId = 222;
        var locations = [];

        locations.push(createLocation());
        locations.push(createLocation(null, null, null, null, null, null, null,
                                      null, null, countryId, null, null, null));

        var person1 = testUtil.createPersonEntity(4, null, null);
        var person2 = testUtil.createPersonEntity(6, null, locations);
        testUtil.addPerson(person1, people);
        testUtil.addPerson(person2, people);

        requestModel.params.locationId = locationId;

        var responseModel = yield personGetUseCase.find(requestModel, queryOptions);

        should.exist(responseModel.people);
        responseModel.people.should.have.length(1);
        responseModel.people[0].id.should.equal(6);
    }));

    it('should format full name properly', co.wrap(function*(){

        var expectedFullName = 'Mr. Ross John \"RP\" (Smith) Perot MD';
        var person = testUtil.createPersonEntity(4, null, null, 'Ross', 'John', 'Perot', 'Mr.', 'RP', 'Smith', 'MD');
        testUtil.addPerson(person, people);

        var responseModel = yield personGetUseCase.find(requestModel, queryOptions);

        responseModel.people[0].name.full.should.equal(expectedFullName);
    }));

    it('should format short name properly', co.wrap(function*(){

        var expectedShortName = 'Ross John Smith';
        var person = testUtil.createPersonEntity(4, null, null, 'Ross', 'John', 'Smith');
        testUtil.addPerson(person, people);

        var responseModel = yield personGetUseCase.find(requestModel, queryOptions);

        responseModel.people[0].name.short.should.equal(expectedShortName);
    }));

    it('should format list name properly', co.wrap(function*(){

        var expectedListName = 'Perot MD, Mr. Ross John \"RP\" Smith';
        var person = testUtil.createPersonEntity(4, null, null, 'Ross', 'John', 'Perot', 'Mr.', 'RP', 'Smith', 'MD');
        testUtil.addPerson(person, people);

        var responseModel = yield personGetUseCase.find(requestModel, queryOptions);

        responseModel.people[0].name.list.should.equal(expectedListName);
    }));

    it('should format picture url properly', co.wrap(function*(){

        var expectedPictureUrl = 'www.xxxxx.com/link.asp?i=ls000000021109';
        var externalLinks = testUtil.createExternalLinkEntity();

        var person = testUtil.createPersonEntity(4, '000000021109', null, 'Ross', 'John', 'Perot',
                                                 'Mr.', 'RP', 'Smith', 'MD', null, null, externalLinks);
        testUtil.addPerson(person, people);

        var responseModel = yield personGetUseCase.find(requestModel, queryOptions);

        responseModel.people[0].externalLinks.picture.should.equal(expectedPictureUrl);
    }));

    it('should format guestbook url properly', co.wrap(function*(){

        var expectedGuestbookUrl = 'www.xxxxx.com/link.asp?i=gb000000021109';
        var externalLinks = testUtil.createExternalLinkEntity();

        var person = testUtil.createPersonEntity(4, '000000021109', null, 'Ross', 'John', 'Perot', 'Mr.',
                                                 'RP', 'Smith', 'MD', null, null, externalLinks);
        testUtil.addPerson(person, people);

        var responseModel = yield personGetUseCase.find(requestModel, queryOptions);

        responseModel.people[0].externalLinks.guestbook.should.equal(expectedGuestbookUrl);
    }));

    it('should append the http protocol and domain to portrait image urls for one or more people', co.wrap(function*(){

        var images1 = [];
        images1.push({name: 'header', href: '/header.jpg'});

        var images2 = [];
        images2.push({name: 'logo', href: '/logo.jpg'});

        var person1 = testUtil.createPersonEntity(4, null, null, null, null, null, null,
                                                  null, null, null, null, images1, null);
        var person2 = testUtil.createPersonEntity(8, null, null, null, null, null, null,
                                                  null, null, null, null, images2, null);
        testUtil.addPerson(person1, people);
        testUtil.addPerson(person2, people);

        var responseModel = yield personGetUseCase.find(requestModel, queryOptions);

        responseModel.people[0].portraitImages[0].href.should.contain.string('http://');
        responseModel.people[1].portraitImages[0].href.should.contain.string('http://');
    }));

    it('should return correct status code for data found', co.wrap(function*(){

        var person1 = testUtil.createPersonEntity(4, null, null, 'Ross', 'Perot');
        testUtil.addPerson(person1, people);
        var person2 = testUtil.createPersonEntity(6, null, null, 'Donald', 'Trump');
        testUtil.addPerson(person2, people);

        var responseModel = yield personGetUseCase.find(requestModel, queryOptions);

        responseModel.http.statusCode.should.equal(200);
        responseModel.people.should.have.length(2);
    }));

    it('should return correct status code for data not found', co.wrap(function*(){

        requestModel.people = [];

        var responseModel = yield personGetUseCase.find(requestModel);

        responseModel.http.statusCode.should.equal(204);
        should.not.exist(responseModel.people);
    }));

    it('should return the number of people requested by limit', co.wrap(function*(){

        var limit = 2;

        var person1 = testUtil.createPersonEntity(4);
        var person2 = testUtil.createPersonEntity(6);
        var person3 = testUtil.createPersonEntity(8);
        testUtil.addPerson(person1, people);
        testUtil.addPerson(person2, people);
        testUtil.addPerson(person3, people);

        var queryOptions = requestModel.params.query;
        queryOptions.limit = limit;

        inMemoryGateway.data(people);

        var responseModel = yield personGetUseCase.find(requestModel, queryOptions);

        responseModel.http.statusCode.should.equal(200);
        should.exist(responseModel.people);
        responseModel.people.should.have.length(limit);
    }));


    function setGateway(people) {
        inMemoryGateway.data(people);
        personGetUseCase.gateway(inMemoryGateway);
    };

    function setQueryOptions(){
        queryOptions = requestModel.params.query;
        queryOptions.limit = limit;
    };

    function createLocation(cityId, cityHref, cityName, cityUrlSafeName,
                            stateId, stateCode, stateHref, stateName, stateUrlSafeName,
                            countryId, countryHref, countryName, countryCode){
        return {
            "city": {
                "href": cityHref,
                "id": cityId,
                "name": cityName,
                "urlSafeName": cityUrlSafeName
            },
            "state": {
                "href": stateHref,
                "id": stateId,
                "name": stateName,
                "code": stateCode,
                "urlSafeName": stateUrlSafeName
            },
            "country": {
                "href": countryHref,
                "id": countryId,
                "name": countryName,
                "code": countryCode
            }
        };
    }
});

