import * as core from '@actions/core';
import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';

let octokit:github.GitHub;
let context:Context;

function createPR(baseBranch:string, headBranch:string, title:string, body:string) {
    console.log('Creating PR ' + title + ' from branch ' + headBranch);

    octokit.pulls.create({
        ...context.repo,
        base: 'refs/heads/' + baseBranch,
        head: 'refs/heads/' + headBranch,
        title,
        body,
    });
}

function createBranch(name:string, sha:string) {
    console.log('Creating branch ' + name);

    octokit.git.createRef({
        ...context.repo,
        ref: 'refs/heads/' + name,
        sha,
    });
}

function updateMergeBranch(name:string, sha:string) {
    console.log('Fast forwaring branch ' + name);

    octokit.git.updateRef({
        ...context.repo,
        ref: 'refs/heads/' + name,
        sha,
    });
}

async function isExistingBranch(name:string):Promise<boolean> {
    const matchingResults = await octokit.git.listMatchingRefs({
        ...context.repo,
        ref: 'refs/heads/' + name
    });

    console.log('Matches for existing branch', matchingResults);

    return matchingResults.data.length > 0;
}

async function isExistingPullRequest(headBranchName:string) {
    const matchingResults = await octokit.pulls.list({
        ...context.repo,
        state: 'open',
        head: headBranchName, // TODO Don't know if we need organization here
    });

    console.log('Matches for existing PR', matchingResults);

    return matchingResults.data.length > 0;
}

async function run() {
    // Get config
    const toBranch = core.getInput('to-branch');
    const token = core.getInput('github-token');
    const autoMerge = core.getInput('auto-merge') == 'true' ? true : false;

    octokit = new github.GitHub(token);
    context = github.context;

    // Get name of triggering branch witout refs/heads/
    const fromBranch = context.ref.slice(11);
    console.log('From branch is ' + fromBranch);

    // TODO Validate that changes happened in from brach. Either here or in workflow configuration if possible
    // TODO Use wildcards in validating branch
    // TODO Compare branches
    const mergeBranchName = `merge/${fromBranch}-to-${toBranch}`;

    // TODO Merge branch if auto merge is on

    const inConflict = false;
    const isExistingMergeBranch = await isExistingBranch(mergeBranchName);
    var isExistingPR = false;

    // Create merge branch if conflict or update existing branch
    if (isExistingMergeBranch) {
        // TODO Update reference with added commits
        updateMergeBranch(mergeBranchName, context.sha);
        isExistingPR = await isExistingPullRequest(mergeBranchName);
    } else {
        createBranch(mergeBranchName, context.sha);
    }

    // Create PR if no auto merge or conflict
    if (!isExistingPR && (!autoMerge || inConflict)) {
        createPR(toBranch, mergeBranchName, 'TODO Title', 'TODO Body');
    }
}

run().catch(core.setFailed)
