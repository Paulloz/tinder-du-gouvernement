export class MainController {
    constructor ($log, $scope, $http, $timeout) {
        'ngInject';

        this.$timeout = $timeout;
        this.$scope = $scope;
        this.$scope.score = 0;
        this.done = 0;
        this.$scope.deckSize = 15;

        this.$scope.ending = [];

        $http.get('assets/tsv/gvt.tsv').then(response => {
            let gvt = [];
            response.data = d3_dsv.tsvParse(response.data, d => new Object({
                ID : +d.ID,
                surname : d['Prénom'],
                name : d.Nom,
                isPartOf : +d.Gouvernement === 1,
                title : d.Poste
            }));

            this.gvt = response.data;
            this.deck = _.shuffle(_.sampleSize(response.data, this.$scope.deckSize));
            this.$scope.persons = this.deck;
        });

        this.$scope.ok = this.ok.bind(this);
        this.$scope.ko = this.ko.bind(this);
        this.$scope.hasEnded = this.hasEnded.bind(this);
    }

    removeLastPerson(ok) {
        const last = _.last(this.$scope.persons);
        let label = `${last.surname} ${last.name}`;
        if (last.isPartOf) {
            label += (last.ok ? ' est bien ' : ' est en fait ') + last.title + '.';
        } else {
            label += last.ok ? ' ne fait en effet pas parti du gouvernement.' : ' ne fait pas parti du gouvernement.';
        }
        this.$scope.ending.push({
            ok : last.ok,
            label : label
        });

        ++this.done;

        this.$scope.persons = _.dropRight(this.$scope.persons);
    }

    isLastPartOf() {
        return _.last(this.$scope.persons).isPartOf;
    }

    ok(isTriggeredByClick) {
        const execute = () => {
            if (this.isLastPartOf()) {
                ++this.$scope.score;
            }
            _.last(this.$scope.persons).ok = this.isLastPartOf();
            this.removeLastPerson();
        }

        if (isTriggeredByClick) {
            this.$scope.$broadcast('card-ok', _.last(this.$scope.persons).ID);
            this.$timeout(execute.bind(this), 500);
        } else {
            execute();
        }
    }

    ko(isTriggeredByClick) {
        const execute = () => {
            if (!this.isLastPartOf()) {
                ++this.$scope.score;
            }
            _.last(this.$scope.persons).ok = !this.isLastPartOf();
            this.removeLastPerson();
        }

        if (isTriggeredByClick) {
            this.$scope.$broadcast('card-ko', _.last(this.$scope.persons).ID);
            this.$timeout(execute.bind(this), 500);
        } else {
            execute();
        }
    }

    hasEnded() {
        return this.done >= this.$scope.deckSize;
    }
}